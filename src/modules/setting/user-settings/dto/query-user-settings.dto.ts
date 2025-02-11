import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class QueryUserSettingDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    settingKey?: string;

    @ApiProperty({ description: "setting category", required: false })
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
    @Transform(({ value }) => parseInt(value) || 0)
    page?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 10)
    pageSize?: number;
}