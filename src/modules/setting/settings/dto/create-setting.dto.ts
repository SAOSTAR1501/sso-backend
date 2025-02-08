import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsEnum, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { SettingDataType } from '../data/settings-data-type.enum';

export class CreateSettingDto {
    @ApiProperty({ description: 'Setting key' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.toLowerCase())
    key: string;

    @ApiProperty({ description: 'Setting value' })
    @IsObject()
    @IsNotEmpty()
    value: Record<string, any>;

    @ApiProperty({ description: 'Setting label in different languages' })
    @IsObject()
    @IsNotEmpty()
    label: Record<string, string>;

    @ApiProperty({ description: 'Category ID' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ description: 'Data type', enum: SettingDataType })
    @IsEnum(SettingDataType)
    @IsNotEmpty()
    dataType: SettingDataType;

    @ApiProperty({ description: 'Setting options' })
    @IsObject()
    @IsOptional()
    options?: Record<string, any>;

    @ApiProperty({ description: 'Is system setting' })
    @IsBoolean()
    @IsOptional()
    isSystem?: boolean;

    @ApiProperty({ description: 'Is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}