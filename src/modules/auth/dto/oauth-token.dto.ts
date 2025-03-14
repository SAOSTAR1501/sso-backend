import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OauthTokenDto {
    @ApiProperty({description: 'Grant type', example: 'authorization_code | refresh_token'})
    @IsString()
    grantType: string;

    @ApiProperty({description: 'code', type: String})
    @IsString()
    @IsOptional()
    code: string;

    @ApiProperty({description: 'redirect_uri', type: String})
    @IsString()
    redirectUri: string;

    @ApiProperty({description: 'client_id', type: String})
    @IsString()
    clientId: string;

    @ApiProperty({description: 'client_secret', type: String})
    @IsString()
    clientSecret: string;

    @ApiProperty({description: 'refresh_token', type: String})
    @IsString()
    @IsOptional()
    refreshToken: string;
}