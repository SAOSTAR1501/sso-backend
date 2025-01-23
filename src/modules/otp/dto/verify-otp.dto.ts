import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class VerifyOtpDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    otp:string;

    @ApiProperty({ example: 'RESET_PASSWORD' })
    @IsString()
    @IsNotEmpty()
    type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION';
}