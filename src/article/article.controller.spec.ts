import { Test } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '@prisma/client';
import {
  ArticlesQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: ArticleService;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'user@example.com',
    password: 'hashed-password',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: 'admin-id-1',
    role: 'ADMIN',
  };

  const mockArticle = {
    id: 'article-id-1',
    title: 'Test Article',
    content: 'Test content',
    isPublic: true,
    authorId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [{ id: 1, name: 'nestjs' }],
    author: {
      id: mockUser.id,
      email: mockUser.email,
    },
  };

  const privateArticle = {
    ...mockArticle,
    id: 'private-article',
    isPublic: false,
  };

  beforeEach(async () => {
    const createMock = jest.fn().mockResolvedValue(mockArticle);
    const findAllMock = jest
      .fn()
      .mockResolvedValue({ articles: [mockArticle], count: 1 });

    const findOneMock = jest
      .fn()
      .mockImplementation((id: string, userId?: string) => {
        if (id === 'not-found') throw new NotFoundException();
        if (id === 'private-article' && userId !== mockUser.id)
          throw new ForbiddenException();
        return id === 'private-article' ? privateArticle : mockArticle;
      });

    const updateMock = jest.fn().mockImplementation((id: string) => {
      if (id === 'not-found') throw new NotFoundException();
      if (id === 'other-user-article') throw new ForbiddenException();
      return mockArticle;
    });

    const removeMock = jest.fn().mockImplementation((id: string) => {
      if (id === 'not-found') throw new NotFoundException();
      if (id === 'other-user-article') throw new ForbiddenException();
      return mockArticle;
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            findOne: findOneMock,
            update: updateMock,
            remove: removeMock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get<ArticleController>(ArticleController);
    service = moduleRef.get<ArticleService>(ArticleService);
  });

  describe('create()', () => {
    const dto: CreateArticleDto = {
      title: 'New Article',
      content: 'Article content',
      tags: ['nestjs'],
    };

    it('should create article', async () => {
      const spy = jest.spyOn(service, 'create');
      const result = await controller.create(mockUser, dto);
      expect(result).toEqual({ article: mockArticle });
      expect(spy).toHaveBeenCalledWith(mockUser.id, dto);
    });

    it('should throw error for unauthenticated user', async () => {
      const nullUser = null as unknown as User;
      jest.spyOn(service, 'create').mockRejectedValue(new ForbiddenException());
      await expect(controller.create(nullUser, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll()', () => {
    it('should return public articles for guests', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll({}, undefined);
      expect(result).toEqual({ articles: [mockArticle], count: 1 });
      expect(spy).toHaveBeenCalledWith({}, undefined);
    });

    it('should return all accessible articles for authenticated users', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll({}, mockUser.id);
      expect(result).toEqual({ articles: [mockArticle], count: 1 });
      expect(spy).toHaveBeenCalledWith({}, mockUser.id);
    });

    it('should apply filters correctly', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const query: ArticlesQueryDto = {
        tags: ['nestjs'],
        author: 'user@example.com',
        limit: 5,
        offset: 10,
      };
      await controller.findAll(query, mockUser.id);
      expect(spy).toHaveBeenCalledWith(query, mockUser.id);
    });
  });

  describe('findOne()', () => {
    it('should return public article for guest', async () => {
      const result = await controller.findOne(mockArticle.id, undefined);
      expect(result).toEqual({ article: mockArticle });
    });

    it('should return private article for author', async () => {
      const result = await controller.findOne('private-article', mockUser.id);
      expect(result).toEqual({ article: privateArticle });
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(controller.findOne('not-found', undefined)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 for private article of another user', async () => {
      await expect(
        controller.findOne('private-article', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update()', () => {
    const dto: UpdateArticleDto = { title: 'Updated Title' };

    it('should update article for author', async () => {
      const result = await controller.update(mockArticle.id, mockUser, dto);
      expect(result.article).toEqual(mockArticle);
    });

    it('should allow ADMIN to update any article', async () => {
      const result = await controller.update(
        'other-user-article',
        mockAdminUser,
        dto,
      );
      expect(result.article).toEqual(mockArticle);
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(
        controller.update('not-found', mockUser, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw 403 when non-author tries to update', async () => {
      await expect(
        controller.update('other-user-article', mockUser, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove()', () => {
    it('should delete article for author', async () => {
      const result = await controller.remove(mockArticle.id, mockUser);
      expect(result).toEqual({ message: 'Article deleted successfully' });
    });

    it('should allow ADMIN to delete any article', async () => {
      const result = await controller.remove(
        'other-user-article',
        mockAdminUser,
      );
      expect(result).toEqual({ message: 'Article deleted successfully' });
    });

    it('should throw 404 for non-existing article', async () => {
      await expect(controller.remove('not-found', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when non-author tries to delete', async () => {
      await expect(
        controller.remove('other-user-article', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
