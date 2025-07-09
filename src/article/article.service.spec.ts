import { Test } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

describe('ArticleService', () => {
  let articleService: ArticleService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-id-1',
    email: 'user@example.com',
    role: 'USER',
  };

  const mockAdmin = {
    ...mockUser,
    id: 'admin-id-1',
    role: 'ADMIN',
  };

  const mockTag = {
    id: 1,
    name: 'nestjs',
  };

  const mockArticle = {
    id: 'article-id-1',
    title: 'Test Article',
    content: 'Test content',
    isPublic: true,
    authorId: mockUser.id,
    author: {
      id: mockUser.id,
      email: mockUser.email,
    },
    tags: [mockTag],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const privateArticle = {
    ...mockArticle,
    id: 'private-article',
    isPublic: false,
  };

  const otherUserArticle = {
    ...mockArticle,
    id: 'other-user-article',
    authorId: 'other-user-id',
    author: {
      id: 'other-user-id',
      email: 'other@example.com',
    },
  };

  beforeEach(async () => {
    const articleFindUniqueMock = jest
      .fn()
      .mockImplementation((params: { where: { id: string } }) => {
        if (params.where.id === 'not-found') return null;
        if (params.where.id === 'private-article') return privateArticle;
        if (params.where.id === 'other-user-article') return otherUserArticle;
        return mockArticle;
      });

    const articleUpdateMock = jest
      .fn()
      .mockImplementation(
        (params: { where: { id: string }; data: UpdateArticleDto }) => ({
          ...mockArticle,
          ...params.data,
          id: params.where.id,
        }),
      );

    const tagCreateMock = jest
      .fn()
      .mockImplementation((params: { data: { name: string } }) => ({
        id: 2,
        name: params.data.name,
      }));

    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              create: jest.fn().mockResolvedValue(mockArticle),
              findMany: jest.fn().mockResolvedValue([mockArticle]),
              count: jest.fn().mockResolvedValue(1),
              findUnique: articleFindUniqueMock,
              update: articleUpdateMock,
              delete: jest.fn().mockResolvedValue(mockArticle),
            },
            tag: {
              findMany: jest.fn().mockResolvedValue([mockTag]),
              create: tagCreateMock,
            },
          },
        },
      ],
    }).compile();

    articleService = moduleRef.get<ArticleService>(ArticleService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const createDto: CreateArticleDto = {
      title: 'New Article',
      content: 'Article content',
      tags: ['nestjs'],
    };

    it('should create article with existing tags', async () => {
      const createSpy = jest.spyOn(prisma.article, 'create');
      const result = await articleService.create(mockUser.id, createDto);
      expect(result).toEqual(mockArticle);
      expect(createSpy).toHaveBeenCalled();
    });

    it('should create new tags when needed', async () => {
      jest.spyOn(prisma.tag, 'findMany').mockResolvedValue([]);
      const createSpy = jest.spyOn(prisma.tag, 'create');

      await articleService.create(mockUser.id, {
        ...createDto,
        tags: ['new-tag'],
      });

      expect(createSpy).toHaveBeenCalledWith({ data: { name: 'new-tag' } });
    });

    it('should handle mixed existing and new tags', async () => {
      jest.spyOn(prisma.tag, 'findMany').mockResolvedValue([mockTag]);
      const createSpy = jest.spyOn(prisma.tag, 'create');

      await articleService.create(mockUser.id, {
        ...createDto,
        tags: ['nestjs', 'new-tag'],
      });

      expect(createSpy).toHaveBeenCalledWith({ data: { name: 'new-tag' } });
    });
  });

  describe('findAll', () => {
    it('should return only public articles for guests', async () => {
      const findManySpy = jest.spyOn(prisma.article, 'findMany');
      const result = await articleService.findAll({}, undefined);
      expect(result.articles).toEqual([mockArticle]);
      expect(findManySpy).toHaveBeenCalled();
    });

    it('should return accessible articles for authenticated users', async () => {
      const findManySpy = jest.spyOn(prisma.article, 'findMany');
      const result = await articleService.findAll({}, mockUser.id);
      expect(result.articles).toEqual([mockArticle]);
      expect(findManySpy).toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      const findManySpy = jest.spyOn(prisma.article, 'findMany');
      await articleService.findAll(
        {
          tags: ['nestjs'],
          author: 'user@example.com',
          isPublic: true,
          limit: 5,
          offset: 10,
        },
        mockUser.id,
      );
      expect(findManySpy).toHaveBeenCalled();
    });

    it('should handle tag filter for guests', async () => {
      const findManySpy = jest.spyOn(prisma.article, 'findMany');
      await articleService.findAll({ tags: ['nestjs'] }, undefined);
      expect(findManySpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return public article for guest', async () => {
      const result = await articleService.findOne(mockArticle.id, undefined);
      expect(result).toEqual(mockArticle);
    });

    it('should return private article for author', async () => {
      const result = await articleService.findOne(
        'private-article',
        mockUser.id,
      );
      expect(result).toEqual(privateArticle);
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(
        articleService.findOne('not-found', undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw 403 for private article of another user', async () => {
      await expect(
        articleService.findOne('private-article', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateArticleDto = { title: 'Updated Title' };

    it('should update article for author', async () => {
      const updateSpy = jest.spyOn(prisma.article, 'update');
      const result = await articleService.update(
        mockArticle.id,
        mockUser.id,
        mockUser.role,
        updateDto,
      );
      expect(result.title).toBe('Updated Title');
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should allow ADMIN to update any article', async () => {
      const updateSpy = jest.spyOn(prisma.article, 'update');
      const result = await articleService.update(
        'other-user-article',
        mockAdmin.id,
        mockAdmin.role,
        updateDto,
      );
      expect(result.title).toBe('Updated Title');
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(
        articleService.update(
          'not-found',
          mockUser.id,
          mockUser.role,
          updateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw 403 when non-author tries to update', async () => {
      await expect(
        articleService.update(
          'other-user-article',
          mockUser.id,
          mockUser.role,
          updateDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update tags correctly', async () => {
      const createSpy = jest.spyOn(prisma.tag, 'create');
      await articleService.update(mockArticle.id, mockUser.id, mockUser.role, {
        tags: ['new-tag'],
      });
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete article for author', async () => {
      const deleteSpy = jest.spyOn(prisma.article, 'delete');
      await articleService.remove(mockArticle.id, mockUser.id, mockUser.role);
      expect(deleteSpy).toHaveBeenCalled();
    });

    it('should allow ADMIN to delete any article', async () => {
      const deleteSpy = jest.spyOn(prisma.article, 'delete');
      await articleService.remove(
        'other-user-article',
        mockAdmin.id,
        mockAdmin.role,
      );
      expect(deleteSpy).toHaveBeenCalled();
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(
        articleService.remove('not-found', mockUser.id, mockUser.role),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw 403 when non-author tries to delete', async () => {
      await expect(
        articleService.remove('other-user-article', mockUser.id, mockUser.role),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
