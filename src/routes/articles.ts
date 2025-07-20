import { FastifyInstance, FastifyRequest } from "fastify";
import { ArticleService } from "../services/article";
import { ArticleFilterOptions, ArticleUpdateInput } from "../types/article";
import {
  articleResponseJSONSchema,
  articlesListResponseJSONSchema,
  createArticleJSONSchema,
  createArticleSchema,
  queryParamsJSONSchema,
  queryParamsSchema,
  updateArticleJSONSchema,
} from "../schemas/article";
import { errorResponseJSONSchema } from "../schemas";

export default async function articleRoutes(fastify: FastifyInstance) {
  const articleService = new ArticleService(fastify.prisma);

  fastify.post(
    "/articles",
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: "Создать новую статью",
        tags: ["Articles"],
        security: [{ bearerAuth: [] }],
        body: createArticleJSONSchema,
        response: {
          201: createArticleJSONSchema,
          400: errorResponseJSONSchema,
          401: errorResponseJSONSchema,
        },
      },
    },
    async (request, reply) => {
      const payload = createArticleSchema.parse(request.body);
      const article = await articleService.createArticle({
        ...payload,
        authorId: request.user.id,
      });
      return reply.status(201).send(article);
    }
  );

  fastify.get(
    "/articles",
    {
      schema: {
        description: "Получить список статей с фильтрацией и пагинацией",
        tags: ["Articles"],
        querystring: queryParamsJSONSchema,
        response: {
          200: articlesListResponseJSONSchema,
          400: errorResponseJSONSchema,
          401: errorResponseJSONSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ArticleFilterOptions }>) => {
      const query = queryParamsSchema.parse(request.query);
      const userId = request.user?.id;
      const userRole = request.user?.role;

      return articleService.getArticles(
        {
          tags: query.tags,
          authorId: query.authorId,
          isPublic: query.isPublic,
          search: query.search,
          createdAfter: query.createdAfter,
          createdBefore: query.createdBefore,
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
        userId,
        userRole
      );
    }
  );

  fastify.get(
    "/articles/:id",
    {
      schema: {
        description: "Получить статью",
        tags: ["Articles"],
        response: {
          200: articleResponseJSONSchema,
          404: errorResponseJSONSchema,
          403: errorResponseJSONSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const userId = request.user.id;
      const userRole = request.user.role;

      const article = await articleService.getArticleById(request.params.id);

      // Проверка доступа
      if (!article) {
        reply.code(404).send({ error: "Article not found" });
        return;
      }

      // Гости видят только публичные статьи
      if (!userId && !article.isPublic) {
        reply
          .code(403)
          .send({ error: "Forbidden: Access to private article denied" });
        return;
      }

      // Пользователи видят свои статьи и публичные
      if (
        userId &&
        userRole !== "ADMIN" &&
        article.authorId !== userId &&
        !article.isPublic
      ) {
        reply
          .code(403)
          .send({ error: "Forbidden: Access to private article denied" });
        return;
      }

      return article;
    }
  );

  fastify.put(
    "/articles/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Обновить статью",
        tags: ["Articles"],
        security: [{ bearerAuth: [] }],
        body: updateArticleJSONSchema,
        response: {
          201: updateArticleJSONSchema,
          400: errorResponseJSONSchema,
          401: errorResponseJSONSchema,
          403: errorResponseJSONSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const id = request.params.id;

      const userId = request.user.id;
      const userRole = request.user.role;

      // Проверка прав
      const hasAccess = await articleService.checkArticleOwnership(
        id,
        userId,
        userRole
      );
      if (!hasAccess) {
        reply
          .code(403)
          .send({ error: "Forbidden: You can only edit your own articles" });
        return;
      }

      return articleService.updateArticle(
        id,
        request.body as ArticleUpdateInput
      );
    }
  );

  fastify.delete(
    "/articles/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Удалить статью",
        tags: ["Articles"],
        security: [{ bearerAuth: [] }],
        response: {
          400: errorResponseJSONSchema,
          401: errorResponseJSONSchema,
          403: errorResponseJSONSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const id = request.params.id;

      const userId = request.user.id;
      const userRole = request.user.role;

      // Проверка прав
      const hasAccess = await articleService.checkArticleOwnership(
        id,
        userId,
        userRole
      );
      if (!hasAccess) {
        reply
          .code(403)
          .send({ error: "Forbidden: You can only delete your own articles" });
        return;
      }

      await articleService.deleteArticle(id);
      return { message: "Article deleted successfully" };
    }
  );
}

// Пагинация:
// curl "http://localhost:3000/api/articles?page=2&limit=5"

// Фильтрация по автору:
// curl "http://localhost:3000/api/articles?authorId=1"

// Фильтрация по дате:
// curl "http://localhost:3000/api/articles?createdAfter=2025-01-01T00:00:00Z&createdBefore=2025-12-31T23:59:59Z"

// Поиск по тексту:
// curl "http://localhost:3000/api/articles?search=blockchain"

// Сортировка:
// curl "http://localhost:3000/api/articles?sortBy=title&sortOrder=asc"

// Комбинированный запрос:
// curl "http://localhost:3000/api/articles?tags=tech,programming&authorId=1&page=1&limit=10&sortBy=createdAt&sortOrder=desc"

// Успешное изменение своей статьи:
// curl -X PUT http://localhost:3000/api/articles/1 \
//   -H "Authorization: Bearer <OWNER_TOKEN>" \
//   -H "Content-Type: application/json" \
//   -d '{"title":"My Updated Title"}'
// # Должен быть успешный ответ
