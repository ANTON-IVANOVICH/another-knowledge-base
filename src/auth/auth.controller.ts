import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, RegistrationResponse } from './dto/registration.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        id: 'cjujrmql4000103lqzrmx6v1f',
        email: 'user@example.com',
        createdAt: '2023-05-15T10:00:00.000Z',
        updatedAt: '2023-05-15T10:00:00.000Z',
      },
    },
    type: RegistrationResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request (validation failed)' })
  @ApiResponse({ status: 409, description: 'Conflict (email already exists)' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegistrationResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      example: { valid: true },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  validateToken() {
    return { valid: true };
  }
}
