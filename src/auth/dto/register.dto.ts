// src/auth/dto/register.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name (optional)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  // ----------------------------------------------------------
  // Reserved for idempotency support (client can send UUID key)
  // Not used yet — will be implemented later for safe retries.
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: '3d19c330-e2f9-4eae-a5d2-b29344ac5e42',
    description:
      'Reserved idempotency key for safe retries. Currently unused but kept for future API consistency.',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
