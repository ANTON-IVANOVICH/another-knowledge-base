import { FastifyInstance, FastifyRequest } from "fastify";
import { ArticleService } from "../services/article";
import { ArticleFilterOptions } from "../types/article";
import { z } from "zod";

const createArticleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(true),
});

const updateArticleSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

const queryParamsSchema = z.object({
  tags: z.string().optional(),
  isPublic: z.string().optional(),
});

export default async function articleRoutes(fastify: FastifyInstance) {
  const articleService = new ArticleService(fastify.prisma);

  fastify.post(
    "/articles",
    {
      schema: {
        body: createArticleSchema,
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              isPublic: { type: "boolean" },
              author: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                },
              },
              tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    title: { type: "string" },
                  },
                },
              },
            },
          },
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
    async (request: FastifyRequest<{ Querystring: ArticleFilterOptions }>) => {
      const { tags, isPublic } = request.query;

      const filters: ArticleFilterOptions = {
        tags: tags ? tags : undefined,
        isPublic: isPublic ? isPublic : undefined,
      };

      return articleService.getArticles(filters);
    }
  );

  fastify.get(
    "/articles/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      return articleService.getArticleById(request.params.id);
    }
  );

  fastify.put(
    "/articles/:id",
    {
      schema: {
        body: updateArticleSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      return articleService.updateArticle(
        request.params.id,
        request.body as any
      );
    }
  );

  fastify.delete(
    "/articles/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      await articleService.deleteArticle(request.params.id);
      return { message: "Article deleted successfully" };
    }
  );
}
