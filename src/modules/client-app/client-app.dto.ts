import { IsString, IsArray, IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClientAppDto {
  @ApiProperty({ example: 'My Web App' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A web application for my service' })
  @IsString()
  description: string;

  @ApiProperty({ 
    example: ['https://myapp.com/callback', 'https://dev.myapp.com/callback'],
    description: 'List of allowed redirect URIs'
  })
  @IsArray()
  @IsString({ each: true })
  redirectUris: string[];

  @ApiProperty({ 
    example: ['profile', 'email'],
    description: 'List of allowed OAuth scopes' 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedScopes?: string[];

  @ApiProperty({ 
    example: false,
    description: 'Whether this is a trusted application (skips consent screen)' 
  })
  @IsBoolean()
  @IsOptional()
  trusted?: boolean;

  @ApiProperty({ 
    example: 3600,
    description: 'Access token lifetime in seconds (default: 1 hour)' 
  })
  @IsNumber()
  @Min(300) // Minimum 5 minutes
  @Max(86400) // Maximum 24 hours
  @IsOptional()
  accessTokenLifetime?: number;


  @ApiProperty({type: Boolean, description: "Active"})
  @IsOptional()
  @IsBoolean()
  active: boolean;

  @ApiProperty({ 
    example: 2592000,
    description: 'Refresh token lifetime in seconds (default: 30 days)' 
  })
  @IsNumber()
  @Min(3600) // Minimum 1 hour
  @Max(31536000) // Maximum 1 year
  @IsOptional()
  refreshTokenLifetime?: number;
}
export class UpdateClientAppDto extends PartialType(CreateClientAppDto) {}

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({
    description: 'Search term to filter results',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort field (prefix with - for descending order, e.g., -createdAt)',
    required: false,
    default: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = '-createdAt';
}

export class ClientAppPaginationQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Include inactive client apps',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean = false;
}