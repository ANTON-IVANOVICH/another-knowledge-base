import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-id-1',
    email: 'user@example.com',
    password: 'hashedPassword',
    role: 'USER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const registerDto: RegisterDto = {
    email: 'user@example.com',
    password: 'Password123!',
  };

  const loginDto: LoginDto = {
    email: 'user@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
                createdAt: mockUser.createdAt,
                updatedAt: mockUser.updatedAt,
              }),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should register new user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      const createSpy = jest.spyOn(prisma.user, 'create');

      const result = await authService.register(registerDto);

      expect(result.email).toBe(registerDto.email);
      expect(createSpy).toHaveBeenCalled();
    });

    it('should throw conflict for existing email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password securely', async () => {
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashedPassword' as never);
      await authService.register(registerDto);
      expect(hashSpy).toHaveBeenCalledWith(
        registerDto.password,
        expect.any(String),
      );
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        password: await bcrypt.hash(loginDto.password, 10),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const signSpy = jest.spyOn(jwtService, 'sign');

      const result = await authService.login(loginDto);

      expect(result.access_token).toBe('jwt-token');
      expect(signSpy).toHaveBeenCalled();
    });

    it('should throw unauthorized for invalid email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw unauthorized for invalid password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should verify password correctly', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(true as never);

      await authService.login(loginDto);
      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });
});
