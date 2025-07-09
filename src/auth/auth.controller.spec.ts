import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockRegistrationResponse = {
    id: 'user-id-1',
    email: 'user@example.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    access_token: 'jwt-token',
    user: {
      id: 'user-id-1',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  beforeEach(async () => {
    const registerMock = jest.fn().mockResolvedValue(mockRegistrationResponse);
    const loginMock = jest.fn().mockResolvedValue(mockLoginResponse);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: registerMock,
            login: loginMock,
          },
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register new user', async () => {
      const spy = jest.spyOn(authService, 'register');
      const result = await authController.register(dto);
      expect(result).toEqual(mockRegistrationResponse);
      expect(spy).toHaveBeenCalledWith(dto);
    });

    it('should throw conflict for duplicate email', async () => {
      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(new ConflictException());
      await expect(authController.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user', async () => {
      const spy = jest.spyOn(authService, 'login');
      const result = await authController.login(dto);
      expect(result).toEqual(mockLoginResponse);
      expect(spy).toHaveBeenCalledWith(dto);
    });

    it('should throw unauthorized for invalid credentials', async () => {
      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new UnauthorizedException());
      await expect(authController.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    it('should validate token with JWT guard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        AuthController.prototype.validateToken,
      ) as any[];
      expect(guards).toBeDefined();
    });
  });
});
