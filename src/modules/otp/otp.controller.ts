import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../decorators/public.decorator';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }
    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid OTP' })
    async verifyOtp(
        @Body() body: VerifyOtpDto
    ) {
        return await this.otpService.verifyOTP(body.email, body.otp, body.type);
    }
}