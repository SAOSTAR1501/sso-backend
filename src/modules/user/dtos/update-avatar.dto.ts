import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateAvatarDto {
    @ApiProperty({ type: String, description: 'URL of the avatar' })
    @IsString()
    url: string;

    @ApiProperty({ type: String, description: 'Public ID of the avatar' })
    @IsString()
    publicId: string;
}