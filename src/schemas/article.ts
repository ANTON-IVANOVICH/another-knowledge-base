import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const createArticleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
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
  tags: z.array(z.string()).optional(),
  authorId: z.string().optional(),
  isPublic: z
    .string()
    .optional()
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
  createdAfter: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  createdBefore: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  page: z.string().optional().transform(Number).default("1"),
  limit: z.string().optional().transform(Number).default("10"),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const articleResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  isPublic: z.boolean(),
  authorId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional(),
  }),
});

const articlesListResponseSchema = z.object({
  data: z.array(articleResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

const createArticleJSONSchema = zodToJsonSchema(createArticleSchema, {
  name: "CreateArticle",
});

const updateArticleJSONSchema = zodToJsonSchema(updateArticleSchema, {
  name: "UpdateArticle",
});

const queryParamsJSONSchema = zodToJsonSchema(queryParamsSchema, {
  name: "QueryParams",
});

const articleResponseJSONSchema = zodToJsonSchema(articleResponseSchema, {
  name: "ArticleResponse",
});

const articlesListResponseJSONSchema = zodToJsonSchema(
  articlesListResponseSchema,
  {
    name: "ArticlesListResponse",
  }
);

export {
  createArticleSchema,
  updateArticleSchema,
  queryParamsSchema,
  articleResponseSchema,
  articlesListResponseSchema,
  createArticleJSONSchema,
  updateArticleJSONSchema,
  queryParamsJSONSchema,
  articleResponseJSONSchema,
  articlesListResponseJSONSchema,
};
