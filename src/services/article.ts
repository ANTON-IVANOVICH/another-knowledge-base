import { PrismaClient } from "@prisma/client";
import { ArticleCreateInput, ArticleUpdateInput } from "../types/article";

export class ArticleService {
  constructor(private prisma: PrismaClient) {}

  async createArticle(data: ArticleCreateInput) {
    const { tags, ...rest } = data;
    return this.prisma.article.create({
      data: {
        ...rest,
        tags: tags?.length
          ? { connect: tags.map((tagId) => ({ id: Number(tagId) })) }
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
    filters: {
      tags?: string[];
      isPublic?: boolean;
      authorId?: string;
    } = {}
  ) {
    const where: any = {};
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { some: { id: { in: filters.tags.map((t) => Number(t)) } } };
    }
    return this.prisma.article.findMany({
      where,
      include: {
        author: { select: { id: true, email: true, name: true } },
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateArticle(id: string, data: ArticleUpdateInput) {
    const { tags, ...rest } = data;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...rest,
        tags: tags
          ? {
              set: [],
              connect: tags.map((tagId) => ({ id: Number(tagId) })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, email: true, name: true } },
        tags: true,
      },
    });
  }

  async deleteArticle(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }
}
