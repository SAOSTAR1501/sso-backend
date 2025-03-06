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

    @ApiProperty({ example: 'http://localhost:3000' })
    @IsString()
    @IsOptional()
    redirectUri: string;

    @ApiProperty({ example: 'client123', required: false, description: 'Client ID' })
    @IsString()
    @IsOptional()
    clientId: string;
}