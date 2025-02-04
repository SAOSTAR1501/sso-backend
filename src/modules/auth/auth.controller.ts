// auth.controller.ts
import {
  BadRequestException,
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
import { JwtService } from '@nestjs/jwt';
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
import { ConfigService } from '@nestjs/config';
import 'src/types/session';
import { GoogleUser } from './interfaces/oauth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
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

    if (result.tokens) {
      this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return res.json({
      success: true,
      data: {
        user: result.user,
        redirectTo: result.redirectTo
      }
    });
  }

  // @Public()
  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // @ApiOperation({ summary: 'Google OAuth login' })
  // @ApiQuery({ name: 'redirect_uri', required: false })
  // async googleAuth(@Query('redirect_uri') redirectUri: string, @Req() req: Request) {
  //   console.log('Query Parameters:', req.query); // Debug log
  //   if (redirectUri) {
  //     console.log({ redirectUri });
  //     req.session.redirectUri = redirectUri;
  //   }
  // }

  // @Public()
  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // @ApiOperation({ summary: 'Google OAuth callback' })
  // async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
  //   const result = await this.authService.googleLogin(req.user);

  //   const redirectUri = req.session.redirectUri || this.configService.get('DEFAULT_CLIENT_REDIRECT_URL');

  //   this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
  //   return res.json({
  //     success: true,
  //     data: {
  //       user: result.user,
  //       redirectUri
  //     }
  //   });
  // }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiQuery({ name: 'redirect_uri', required: false })
  async googleAuth(
    @Query('redirect_uri') redirectUri: string,
    @Req() req: Request,
  ) {
    if (redirectUri) {
      // Validate redirect URL
      if (!this.authService.validateRedirectUrl(redirectUri)) {
        throw new BadRequestException('Invalid redirect URL');
      }
    }
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUser;
    const result = await this.authService.googleLogin(googleUser);
    
    const redirectUri = googleUser.redirectUri || 
                       this.configService.get('DEFAULT_CLIENT_REDIRECT_URL');
    
    this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
    console.log({ redirectUri });
    return res.redirect(`${redirectUri}?success=true`);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
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
    return await this.authService.getCurrentUser(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token from database' })
  @ApiResponse({ status: 200, description: 'New access token generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid/Expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Get expired JWT from cookie and decode it to get userId
      const refreshToken = req.cookies['refreshToken'];
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid refresh token'
        })
      }
      const result = await this.authService.refreshToken(refreshToken);
      // Set new access token in cookie
      this.setTokenCookie(res, result.accessToken, result.refreshToken);

      return res.json({
        success: true
      });

    } catch (error) {
      // Clear cookie if refresh fails
      this.clearTokenCookie(res);
      throw error;
    }
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

  private setTokenCookie(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });
  }

  private clearTokenCookie(res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN,
      sameSite: 'lax',
    });
  }
}