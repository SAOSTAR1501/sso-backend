import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserSettingDto {
    @ApiProperty()
    @IsNotEmpty()
    settingKey: string;

    @ApiProperty()
    @IsNotEmpty()
    value: any;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}