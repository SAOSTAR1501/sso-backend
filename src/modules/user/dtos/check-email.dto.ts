import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CheckEmailDto {
    @ApiProperty({ example: 'saostar1501@gmail.com' })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;
}