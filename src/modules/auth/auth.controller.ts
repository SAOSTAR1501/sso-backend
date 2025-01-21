// auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../decorators/public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guard/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) { }

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    this.setTokenCookie(res, result.tokens.accessToken);
    return res.json({
      success: true,
      user: result.user,
      redirectTo: result.redirectTo
    });
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    if (result.tokens.accessToken) {
      // Nếu có redirect URL, chuyển hướng người dùng
      this.setTokenCookie(res, result.tokens.accessToken);
    }

    // Nếu không có redirect, set cookie và trả về response bình thường
    return res.json({
      success: true,
      user: result.user,
      redirectTo: result.redirectTo
    });
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiQuery({ name: 'redirect_uri', required: false })
  async googleAuth(@Query('redirect_uri') redirectUri: string, @Req() req: Request) {
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    this.setTokenCookie(res, result.tokens.accessToken);
    return res.json({
      success: true,
      user: result.user,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearTokenCookie(res);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  async getCurrentUser(@Req() req: Request) {
    const userId = req.user['id']; // `sub` là định danh người dùng trong payload JWT
    const user = await this.authService.getCurrentUser(userId);
    return {
      success: true,
      user,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password process' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent if email exists' })
  async forgotPassword(
    @Body() body: ForgotPasswordDto
  ) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password' })
  async resetPassword(
    @Body() body: ResetPasswordDto
  ) {
    return this.authService.resetPassword(
      body.email,
      body.otp,
      body.newPassword
    );
  }

  private setTokenCookie(res: Response, token: string) {
    res.cookie('sso_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'lax',
    });
  }

  private clearTokenCookie(res: Response) {
    res.clearCookie('sso_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      sameSite: 'lax',
    });
  }
}