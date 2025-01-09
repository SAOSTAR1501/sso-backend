import { Controller, Get, Post, Req, Res, Render, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Xử lý đăng nhập
  @Post('login')
  async login(@Body() body, @Res() res) {
    const { username, password, redirectUri } = body;
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      return res.status(401).render('login', { message: 'Invalid credentials', redirectUri });
    }
    const token = await this.authService.login(user, res);
    return res.redirect(`${redirectUri}?token=${token.accessToken}`);
  }

  // Xử lý form đăng ký
  @Post('signup')
  async signup(@Body() body, @Res() res) {
    const { username, email, password } = body;
    await this.authService.signup({ username, email, password });
    return res.redirect('/auth/login');
  }

  // Xử lý gửi email khôi phục mật khẩu
  @Post('forgot-password')
  async forgotPassword(@Body() body, @Res() res) {
    const { email } = body;
    await this.authService.forgotPassword(email);
    return res.render('forgot-password', { message: 'Check your email for reset link' });
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Req() req, @Res() res) {
    const refreshToken = req.cookies.refreshToken; // Lấy Refresh Token từ Cookie
    const tokens = await this.authService.refreshToken(refreshToken, res);
    return res.json(tokens); // Chỉ trả Access Token
  }
}