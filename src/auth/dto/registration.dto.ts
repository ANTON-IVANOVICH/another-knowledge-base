import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securepassword123',
    description: 'User password (min 8 characters)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RegistrationResponse {
  @ApiProperty({
    example: 'cjujrmql4000103lqzrmx6v1f',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role of the user',
  })
  role: string;

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
    description: 'Date and time when the user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
    description: 'Date and time when the user was last updated',
  })
  updatedAt: Date;
}
