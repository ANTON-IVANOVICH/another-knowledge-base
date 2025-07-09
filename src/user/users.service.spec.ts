import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-id-1',
    email: 'user@example.com',
    password: 'hashed-password',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    ...mockUser,
    id: 'admin-id-1',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const findUniqueMock = jest
      .fn()
      .mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === 'not-found') return null;
        return mockUser;
      });

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn().mockResolvedValue([mockUser]),
              findUnique: findUniqueMock,
              update: jest.fn().mockImplementation(
                ({ where, data }: { where: { id: string }; data: any }) =>
                  ({
                    ...mockUser,
                    ...data,
                    id: where.id,
                  }) as typeof mockUser & { id: string },
              ),
              delete: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return users without sensitive data', async () => {
      const users = await service.findAll();
      expect(users).toEqual([mockUser]);
      expect(users[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should return user without password', async () => {
      const user = await service.findOne(mockUser.id);
      expect(user).toEqual(mockUser);
      expect(user).not.toHaveProperty('password');
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateUserDto = { email: 'new@example.com' };

    it('should update user', async () => {
      const updatedUser = await service.update(mockUser.id, dto);
      expect(updatedUser.email).toBe('new@example.com');
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(service.update('not-found', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const deletedUser = await service.remove(mockUser.id);
      expect(deletedUser).toEqual(mockUser);
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(service.remove('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent self-deletion', async () => {
      await expect(service.remove(mockAdmin.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
