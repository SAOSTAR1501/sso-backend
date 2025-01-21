// auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  Res, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guard/jwt.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    
    if (result.redirectTo) {
      // Nếu có redirect URL, chuyển hướng người dùng
      return res.redirect(result.redirectTo);
    }

    // Nếu không có redirect, set cookie và trả về response bình thường
    this.setTokenCookie(res, result.tokens.accessToken);
    return res.json({
      success: true,
      user: result.user,
    });
  }

  @Public()
  @Post('login')
  @ApiQuery({ name: 'redirect_uri', required: false })
  @ApiOperation({ summary: 'User login' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    
    if (result.redirectTo) {
      // Nếu có redirect URL, chuyển hướng người dùng
      return res.redirect(result.redirectTo);
    }

    // Nếu không có redirect, set cookie và trả về response bình thường
    this.setTokenCookie(res, result.tokens.accessToken);
    return res.json({
      success: true,
      user: result.user,
    });
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    if (result.redirectTo) {
      return res.redirect(result.redirectTo);
    }

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
    return {
      success: true,
      user: req.user,
    };
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