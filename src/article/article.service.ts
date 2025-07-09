import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ArticlesQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateArticleDto) {
    const tags = await this.processTags(dto.tags);

    // Создаем статью с явным указанием типа
    return this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId: userId,
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: true,
      },
    });
  }

  async findAll(query: ArticlesQueryDto, userId?: string) {
    const { limit = 10, offset = 0, tags, author, isPublic } = query;

    const where: Prisma.ArticleWhereInput = {};

    // Условия видимости
    if (userId) {
      where.OR = [{ authorId: userId }, { isPublic: true }];
    } else {
      where.isPublic = true;
    }

    // Фильтр по тегам
    if (tags && tags.length) {
      where.tags = {
        some: { name: { in: tags } },
      };
    }

    // Фильтр по автору
    if (author) {
      where.author = { email: author };
    }

    // Фильтр по публичности
    if (isPublic !== undefined) {
      // Перезаписываем условия видимости
      where.AND = [
        { isPublic },
        ...(userId ? [{ OR: [{ authorId: userId }, { isPublic: true }] }] : []),
      ];
    }

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        skip: offset,
        take: limit,
        where,
        select: {
          id: true,
          title: true,
          content: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              email: true,
            },
          },
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles, count };
  }

  async findOne(id: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: true,
      },
    });

    if (!article) throw new NotFoundException('Article not found');

    // Проверка доступа к приватной статье
    if (!article.isPublic && article.author.id !== userId) {
      throw new ForbiddenException('No permission to view this article');
    }

    return article;
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateArticleDto,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!article) throw new NotFoundException('Article not found');

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updateData: {
      title?: string;
      content?: string;
      tags?: { set: { id: number }[] };
    } = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.content) updateData.content = dto.content;

    if (dto.tags) {
      const tags = await this.processTags(dto.tags);
      updateData.tags = {
        set: tags.map((tag) => ({ id: tag.id })),
      };
    }

    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!article) throw new NotFoundException('Article not found');

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own articles');
    }

    return this.prisma.article.delete({
      where: { id },
    });
  }

  private async processTags(tagNames: string[]) {
    const existingTags = await this.prisma.tag.findMany({
      where: { name: { in: tagNames } },
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name),
    );

    if (newTagNames.length > 0) {
      const newTags = await Promise.all(
        newTagNames.map((name) => this.prisma.tag.create({ data: { name } })),
      );
      return [...existingTags, ...newTags];
    }

    return existingTags;
  }
}
