import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdatePasswordDto {
    @ApiProperty({
        description: "New password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;
    @ApiProperty({
        description: "New password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}