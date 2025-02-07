import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CheckUsernameDto {
    @ApiProperty({ example: 'saostar1501' })
    @IsString()
    @IsNotEmpty()
    username: string;
}