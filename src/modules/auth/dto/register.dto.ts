import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'http://localhost:3000' })
  @IsString()
  @IsOptional()
  redirectUri: string;

  @ApiProperty({ example: 'client123', required: false, description: 'Client ID' })
  @IsString()
  @IsOptional()
  clientId: string;
}