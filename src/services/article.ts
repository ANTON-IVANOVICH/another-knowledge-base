import { Prisma, PrismaClient } from "@prisma/client";
import {
  ArticleCreateInput,
  ArticleFilterOptions,
  ArticleUpdateInput,
} from "../types/article";

export class ArticleService {
  constructor(private prisma: PrismaClient) {}

  async createArticle(data: ArticleCreateInput) {
    const { title, content, isPublic, authorId, tags } = data;
    return this.prisma.article.create({
      data: {
        title,
        content,
        isPublic,
        authorId,
        tags: tags?.length
          ? {
              connectOrCreate: tags.map((title) => ({
                where: { title },
                create: { title },
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, email: true, name: true } },
        tags: true,
      },
    });
  }

  async getArticleById(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, name: true } },
        tags: true,
      },
    });
  }

  async getArticles(
    filters: ArticleFilterOptions = {},
    userId?: string,
    userRole?: string
  ) {
    const {
      tags,
      authorId,
      isPublic,
      search,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const skip = (page - 1) * limit;

    const clauses: Prisma.ArticleWhereInput[] = [];

    if (tags && tags.length > 0) {
      clauses.push({
        tags: {
          some: {
            title: { in: tags },
          },
        },
      });
    }

    if (authorId) {
      clauses.push({ authorId });
    }

    if (isPublic !== undefined) {
      clauses.push({ isPublic });
    }

    if (search) {
      clauses.push({
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      });
    }

    if (createdAfter || createdBefore) {
      clauses.push({
        createdAt: {
          ...(createdAfter ? { gte: createdAfter } : {}),
          ...(createdBefore ? { lte: createdBefore } : {}),
        },
      });
    }

    if (userRole !== "ADMIN") {
      clauses.push(
        userId
          ? { OR: [{ isPublic: true }, { authorId: userId }] }
          : { isPublic: true }
      );
    }

    const where: Prisma.ArticleWhereInput =
      clauses.length > 0 ? { AND: clauses } : {};

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: { select: { id: true, email: true, name: true } },
          tags: { select: { title: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateArticle(id: string, data: ArticleUpdateInput) {
    const { title, content, isPublic, tags } = data;

    return this.prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isPublic !== undefined && { isPublic }),
        ...(tags
          ? {
              tags: {
                set: [],
                connectOrCreate: tags.map((title) => ({
                  where: { title },
                  create: { title },
                })),
              },
            }
          : {}),
      },
      include: { author: true, tags: true },
    });
  }

  async deleteArticle(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }

  async getArticlesWithAccess(
    filters: {
      tags?: string[];
      isPublic?: boolean;
    } = {},
    userId?: string,
    userRole?: string
  ) {
    const clauses: Prisma.ArticleWhereInput[] = [];

    if (filters.tags && filters.tags.length > 0) {
      clauses.push({
        tags: { some: { title: { in: filters.tags } } },
      });
    }

    if (userRole === "ADMIN") {
      return this.prisma.article.findMany({
        where: clauses.length ? { AND: clauses } : {},
        include: { author: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (userId) {
      clauses.push({ OR: [{ isPublic: true }, { authorId: userId }] });
    } else {
      clauses.push({ isPublic: true });
    }

    return this.prisma.article.findMany({
      where: { AND: clauses },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async checkArticleOwnership(
    articleId: string,
    userId: string,
    userRole: string
  ) {
    if (userRole === "ADMIN") return true;

    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { authorId: true },
    });

    if (!article) throw new Error("Article not found");
    return article.authorId === userId;
  }
}
