import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsString()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    otp: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    newPassword: string;
}