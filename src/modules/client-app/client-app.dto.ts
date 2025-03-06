import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateClientAppDto {
  @ApiProperty({ example: 'skillfloor-app' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ example: 'https://skillfloor.1ai.one' })
  @IsUrl()
  @IsNotEmpty()
  frontendUrl: string;

  @ApiProperty({ example: 'https://skillfloor.1ai.one/bio-api' })
  @IsUrl()
  @IsNotEmpty()
  backendUrl: string;

  @ApiProperty({ 
    example: ['https://skillfloor.1ai.one/auth/callback', 'https://skillfloor.1ai.one/dashboard'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  redirectUrls: string[];

  @ApiProperty({ 
    example: ['https://skillfloor.1ai.one'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  allowedOrigins: string[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @ApiProperty({ example: {}, required: false, type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateClientAppDto {
  @ApiProperty({ example: 'skillfloor-app', required: false })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({ example: 'https://skillfloor.1ai.one', required: false })
  @IsUrl()
  @IsOptional()
  frontendUrl?: string;

  @ApiProperty({ example: 'https://skillfloor.1ai.one/bio-api', required: false })
  @IsUrl()
  @IsOptional()
  backendUrl?: string;

  @ApiProperty({ 
    example: ['https://skillfloor.1ai.one/auth/callback'],
    type: [String],
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  redirectUrls?: string[];

  @ApiProperty({ 
    example: ['https://skillfloor.1ai.one'],
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedOrigins?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @ApiProperty({ example: {}, required: false, type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RegenerateClientSecretDto {
  @ApiProperty({ example: 'client-id-123' })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}