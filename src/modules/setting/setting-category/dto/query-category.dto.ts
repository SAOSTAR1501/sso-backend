import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class QueryCategoryDto {
    @ApiProperty({
        description: 'Search by name or description',
        required: false  // Add this
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiProperty({
        description: 'Search by code',
        required: false  // Add this
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.toUpperCase())
    code?: string;

    @ApiProperty({
        description: 'Filter by isActive',
        required: false  // Add this
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isActive?: boolean;

    @ApiProperty({
        description: 'Filter by isSystem',
        required: false  // Add this
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isSystem?: boolean;

    @ApiProperty({
        description: 'Page number',
        required: false,  // Add this
        default: 0       // You can also add default value
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 0)
    page?: number;

    @ApiProperty({
        description: 'Limit number of items per page',
        required: false,  // Add this
        default: 10      // You can also add default value
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 10)
    pageSize?: number;
}