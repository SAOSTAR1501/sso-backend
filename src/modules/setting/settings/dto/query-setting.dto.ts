import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class QuerySettingDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    key?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isSystem?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    pageSize?: number;
}