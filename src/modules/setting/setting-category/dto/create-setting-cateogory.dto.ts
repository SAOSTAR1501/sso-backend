import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({description: 'Category code'})
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.toUpperCase())
    code: string;

    @ApiProperty({description: 'Category name'})
    @IsObject()
    @IsNotEmpty()
    name: Record<string, string>;

    @ApiProperty({description: 'Category description'})
    @IsObject()
    @IsOptional()
    description?: Record<string, string>;

    @ApiProperty({description: 'Category order'})
    @IsNumber()
    @IsOptional()
    order?: number;

    @ApiProperty({description: 'Category is active'})
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({description: 'Category is system'})
    @IsBoolean()
    @IsOptional()
    isSystem?: boolean;
}