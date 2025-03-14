import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'saostar1501@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Maicongsao234' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'client123', required: false, description: 'Client ID' })
    @IsString()
    @IsOptional()
    clientId: string;

    @ApiProperty({description: 'redirect', required: false})
    @IsString()
    @IsOptional()
    redirect: string;

    @ApiProperty({description: 'redirectUri', required: false})
    @IsString()
    @IsOptional()
    redirectUri: string;
}