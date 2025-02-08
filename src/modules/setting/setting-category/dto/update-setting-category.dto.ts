import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
    @ApiProperty({ description: 'Category name' })
    @IsObject()
    @IsOptional()
    name?: Record<string, string>;

    @ApiProperty({ description: 'Category description' })
    @IsObject()
    @IsOptional()
    description?: Record<string, string>;

    @ApiProperty({ description: 'Category order' })
    @IsNumber()
    @IsOptional()
    order?: number;

    @ApiProperty({ description: 'Category is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ description: 'Category is system' })
    @IsBoolean()
    @IsOptional()
    isSystem?: boolean;
}