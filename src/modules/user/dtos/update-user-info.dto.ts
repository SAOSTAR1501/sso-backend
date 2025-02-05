import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsPhoneNumber } from 'class-validator';

export class UpdateUserInfoDto {
    @ApiProperty({ description: 'Email of the user', required: false })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty({ description: 'Full name of the user', required: false })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ description: 'Username', required: false })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ description: 'Phone number', required: false })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiProperty({ description: 'Date of birth', required: false })
    @IsDateString()
    @IsOptional()
    dateOfBirth?: Date;

    @ApiProperty({ 
        description: 'Gender', 
        enum: ['Male', 'Female', 'Other'],
        required: false 
    })
    @IsEnum(['Male', 'Female', 'Other'])
    @IsOptional()
    gender?: string;
}