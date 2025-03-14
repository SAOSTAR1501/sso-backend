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
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { IUser } from 'src/interfaces/user.interface';
import 'src/types/session';
import { Public } from '../../decorators/public.decorator';
import { ClientAppValidator } from '../client-app/client-app.validator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleGuard } from './guard/google.guard';
import { LocalGuard } from './guard/local.guard';
import { GoogleUser } from './interfaces/oauth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly clientAppValidator: ClientAppValidator
  ) { }

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ) {
    console.log({ registerDto })
    const result = await this.authService.register(registerDto);

    this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
    return res.json({
      success: true,
      data: {
        user: result.user,
        redirectTo: result.redirectTo
      }
    });
  }

  @Public()
  @Get('login')
  @ApiOperation({ summary: 'Trang đăng nhập SSO' })
  @ApiQuery({ name: 'redirect', required: false })
  async loginSSO(
    @Query('redirect') redirect: string,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response
  ) {
    // Chuyển hướng người dùng đến trang đăng nhập frontend của SSO
    // (thay đổi URL này thành URL của trang đăng nhập frontend thực tế)
    return res.redirect(`${process.env.FRONTEND_SSO_URL}/signin?redirect=${encodeURIComponent(redirect || '')}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}`);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
  ) {

    console.log({ loginDto })
    const result = await this.authService.login(loginDto);

    if (result.tokens) {
      this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return res.json({
      success: true,
      data: {
        user: result.user,
        redirectTo: result.redirectTo,
        clientId: result.clientId,
        redirectUri: result.redirectUri
      }
    });
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiQuery({ name: 'redirect_uri', required: false })
  async googleAuth(
    @Query('redirect_uri') redirectUri: string,
    @Query('client_id') clientId: string) {

  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const googleUser = req.user as GoogleUser;
      const result = await this.authService.googleLogin(googleUser);

      // Determine where to redirect the user based on the OAuth flow
      let redirectUrl: string;

      // Check if we have a client-specific redirect URL
      if (googleUser.clientId && googleUser.redirectUri) {
        // Validate the redirect URL for this client
        const isValidRedirect = await this.clientAppValidator.validateRedirectUrl(
          googleUser.clientId,
          googleUser.redirectUri
        );

        if (isValidRedirect) {
          redirectUrl = googleUser.redirectUri;
        } else {
          throw new UnauthorizedException('Invalid redirect URL for client');
        }
      }
      // Fall back to the redirect URI from the flow without a client ID
      else if (googleUser.redirectUri) {
        // Legacy validation
        if (!this.authService.validateRedirectUrl(googleUser.redirectUri)) {
          throw new BadRequestException('Invalid redirect URL');
        }
        redirectUrl = googleUser.redirectUri;
      }
      // Use default redirect URL as last resort
      else {
        redirectUrl = this.configService.get('DEFAULT_CLIENT_REDIRECT_URL');
      }

      if (!redirectUrl) {
        throw new BadRequestException('No valid redirect URI available');
      }

      this.setTokenCookie(res, result.tokens.accessToken, result.tokens.refreshToken);

      // Add tokens to the redirect URL
      const finalRedirectUrl = new URL(redirectUrl);
      finalRedirectUrl.hash = `accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`;

      return res.redirect(finalRedirectUrl.toString());
    } catch (error) {
      // Handle errors gracefully
      const fallbackUrl = this.configService.get('ERROR_REDIRECT_URL');
      return res.redirect(`${fallbackUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearTokenCookie(res);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(LocalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  async getCurrentUser(@User() user: IUser) {
    const userId = user.id;
    return await this.authService.getCurrentUser(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token' })
  async refresh(
    @Req() req: Request,
    @Res() res: Response,
    @Query('client_id') clientId: string
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

      if (clientId) {
        const isValidClient = await this.clientAppValidator.verifyClientCredentials(clientId, '')
        if (!isValidClient) {
          throw new BadRequestException('Invalid client credentials');
        }
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
  @ApiOperation({ summary: 'Initiate forgot password process' })
  async forgotPassword(
    @Body() body: ForgotPasswordDto
  ) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
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
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });
  }

  private clearTokenCookie(res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      sameSite: 'lax',
    });
  }
}