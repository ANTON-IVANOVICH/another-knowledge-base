import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/admin.guard';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-id-1',
    email: 'user@example.com',
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
    const findOneMock = jest.fn().mockImplementation((id: string) => {
      if (id === 'not-found') throw new NotFoundException();
      return mockUser;
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: findOneMock,
            update: jest
              .fn()
              .mockImplementation((id: string, dto: UpdateUserDto) => {
                if (id === 'not-found') throw new NotFoundException();
                return { ...mockUser, ...dto };
              }),
            remove: jest.fn().mockImplementation((id: string) => {
              if (id === 'not-found') throw new NotFoundException();
              if (id === mockAdmin.id) throw new ForbiddenException();
              return mockUser;
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get<UsersController>(UsersController);
    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return users (admin only)', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user', async () => {
      const result = await controller.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(controller.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateUserDto = { email: 'new@example.com' };

    it('should update user', async () => {
      const result = await controller.update(mockUser.id, dto);
      expect(result.email).toBe('new@example.com');
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(controller.update('not-found', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const result = await controller.remove(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw 404 for non-existing user', async () => {
      await expect(controller.remove('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent self-deletion', async () => {
      await expect(controller.remove(mockAdmin.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
