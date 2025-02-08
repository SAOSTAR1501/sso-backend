import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserSettingDto {
    @ApiProperty({ description: 'Setting ID' })
    @IsMongoId()
    @IsNotEmpty()
    setting: string;

    @ApiProperty({ description: 'Setting value' })
    @IsNotEmpty()
    value: any;

    @ApiProperty({ description: 'Is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}