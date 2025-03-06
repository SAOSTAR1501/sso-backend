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
import { LocalGuard } from './guard/local.guard';
import { ConfigService } from '@nestjs/config';
import 'src/types/session';
import { GoogleUser } from './interfaces/oauth.interface';
import { GoogleGuard } from './guard/google.guard';
import { User } from 'src/decorators/user.decorator';
import { IUser } from 'src/interfaces/user.interface';
import { ClientAppValidator } from '../client-app/client-app.validator';

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
        redirectTo: result.redirectTo
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
      const result = await this.authService.refreshToken(refreshToken, clientId);
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

  @Public()
  @Get('authorize')
  @ApiOperation({ summary: 'Initiate SSO authorization flow' })
  @ApiQuery({ name: 'client_id', required: true })
  @ApiQuery({ name: 'redirect_uri', required: true })
  @ApiQuery({ name: 'response_type', required: true, enum: ['code', 'token'] })
  @ApiQuery({ name: 'state', required: false })
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Validate client application
      const isValidClient = await this.clientAppValidator.verifyClientId(clientId);
      if (!isValidClient) {
        throw new UnauthorizedException('Invalid client application');
      }

      // Validate redirect URL is registered for this client
      const isValidRedirect = await this.clientAppValidator.validateRedirectUrl(clientId, redirectUri);
      if (!isValidRedirect) {
        throw new UnauthorizedException('Invalid redirect URL for client application');
      }

      // Check if user is already authenticated
      const accessToken = req.cookies['accessToken'];
      if (accessToken) {
        try {
          // Verify the token to get user info
          const payload = await this.jwtService.verifyAsync(accessToken, {
            secret: this.configService.get('JWT_SECRET'),
          });

          // User is already authenticated - create a response based on response_type
          if (responseType === 'token') {
            // Generate new tokens with client ID embedded
            const tokens = await this.authService.refreshToken(req.cookies['refreshToken'], clientId);
            
            // Redirect with token in URL fragment
            const url = new URL(redirectUri);
            url.hash = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}` +
                      (state ? `&state=${encodeURIComponent(state)}` : '');
            
            return res.redirect(url.toString());
          } else if (responseType === 'code') {
            // Not implemented yet - would generate a temporary code
            throw new BadRequestException('Authorization code flow not supported yet');
          } else {
            throw new BadRequestException('Invalid response_type');
          }
        } catch (error) {
          this.clearTokenCookie(res);
        }
      }

      // Store SSO request parameters in session
      req.session.authState = {
        clientId,
        redirectUri,
        responseType,
        state,
        timestamp: new Date().toISOString()
      };

      // Redirect to login page (with client app branding if available)
      const loginUrl = this.configService.get('SSO_LOGIN_URL') || '/login';
      return res.redirect(`${loginUrl}?client_id=${clientId}`);
    } catch (error) {
      // Redirect to error page
      const errorRedirectUrl = this.configService.get('ERROR_REDIRECT_URL');
      return res.redirect(`${errorRedirectUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Public()
  @Get('sso/callback')
  @UseGuards(LocalGuard)
  @ApiOperation({ summary: 'Complete SSO flow after authentication' })
  async ssoCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Get SSO request from session
      const authState = req.session?.authState;
      if (!authState) {
        throw new BadRequestException('No active SSO flow');
      }

      const { clientId, redirectUri, responseType, state } = authState;
      
      // Clear session state
      delete req.session.authState;

      // Get user info from JWT
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      // Generate tokens with client ID
      const tokens = await this.authService.generateTokensForClient(user, clientId);

      // Redirect based on response_type
      if (responseType === 'token') {
        const url = new URL(redirectUri);
        url.hash = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}` +
                  (state ? `&state=${encodeURIComponent(state)}` : '');
        
        return res.redirect(url.toString());
      } else {
        throw new BadRequestException('Unsupported response_type');
      }
    } catch (error) {
      // Redirect to error page
      const errorRedirectUrl = this.configService.get('ERROR_REDIRECT_URL');
      return res.redirect(`${errorRedirectUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }

  private setTokenCookie(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'none',
    });
  }

  private clearTokenCookie(res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      sameSite: 'none',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.DEV === '1' ? '' : process.env.COOKIE_DOMAIN,
      sameSite: 'none',
    });
  }
}