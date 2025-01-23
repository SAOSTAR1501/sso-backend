import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService
  ) { }

  async register(registerDto: RegisterDto) {
    const redirectUrl = registerDto.redirectUri;
    // Validate redirect URL if provided
    if (redirectUrl && !this.validateRedirectUrl(redirectUrl)) {
      throw new BadRequestException('Invalid redirect URL');
    }

    // Check if user exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userService.create({
      email: registerDto.email,
      fullName: registerDto.fullName,
      password: hashedPassword,
      roles: ['user'],
      avatar: {
        url: `https://avatar.iran.liara.run/username?username=${registerDto.fullName}`,
        publicId: '',
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Build response
    const response = {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
      tokens,
      redirectTo: redirectUrl ? this.buildRedirectUrl(redirectUrl, tokens) : null,
    };

    return response;
  }

  async login(loginDto: LoginDto) {
    const redirectUrl = loginDto.redirectUri;
    // Validate redirect URL if provided
    if (redirectUrl && !this.validateRedirectUrl(redirectUrl)) {
      throw new BadRequestException('Invalid redirect URL');
    }

    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Build response
    const response = {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        avatar: user.avatar,
      },
      tokens,
      // redirectTo: redirectUrl ? this.buildRedirectUrl(redirectUrl, tokens) : null,
      redirectTo: redirectUrl ? redirectUrl : null,
    };

    return response;
  }

  async googleLogin(googleUser: any) {
    let user = await this.userService.findByEmail(googleUser.email);

    if (!user) {
      // Create new user if doesn't exist
      user = await this.userService.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        // No password for Google users
        googleId: googleUser.id,
        avatar: {
          url: googleUser.picture,
          publicId: ''
        },
        roles: ['user'],
      });
    } else if (!user.avatar?.url) {
      // Nếu người dùng tồn tại nhưng chưa có avatar, cập nhật avatar
      user = await this.userService.update(user._id.toString(), {
        avatar: {
          url: googleUser.picture,
          publicId: user.avatar?.publicId || '',
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Get default redirect URL from config if needed
    const defaultRedirectUrl = this.configService.get('DEFAULT_CLIENT_REDIRECT_URL');
    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        picture: user.avatar.url,
      },
      tokens,
      redirectTo: defaultRedirectUrl ? this.buildRedirectUrl(defaultRedirectUrl, tokens) : null,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    })

    const { exp, iat, ...rest } = payload;

    const newAccessToken = await this.jwtService.signAsync(rest, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES'),
    });

    const newRefreshToken = await this.jwtService.signAsync(rest, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      fullName: user.fullName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private buildRedirectUrl(redirectUrl: string, tokens: { accessToken: string, refreshToken: string }) {
    const url = new URL(redirectUrl);
    // Sử dụng URL fragment thay vì query params để bảo mật token
    url.hash = `access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
    return url.toString();
  }

  async forgotPassword(email: string) {
    // Check if user exists
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // For security reasons, we don't want to reveal if the email exists
      return {
        success: true,
        message: 'If your email is registered, you will receive a password reset OTP'
      };
    }

    // Generate and send OTP
    const { otp, shouldSendEmail } = await this.otpService.createOTP(email, 'RESET_PASSWORD');

    // TODO: Send email with OTP
    if (shouldSendEmail && otp) {
      await this.emailService.sendPasswordResetOtp(email, otp);
    } else {
      return {
        success: false,
        message: 'An OTP has already been sent, please check your email!'
      }
    }

    return {
      success: true,
      message: 'If your email is registered, you will receive a password reset OTP'
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    // Verify OTP
    const isValid = await this.otpService.checkOTPResetPassword(email, otp, 'RESET_PASSWORD');

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Get user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userService.update(user._id.toString(), {
      password: hashedPassword
    });

    // Invalidate all refresh tokens
    // await this.userService.invalidateRefreshTokens(user._id);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  validateRedirectUrl(redirectUrl: string): boolean {
    try {
      const url = new URL(redirectUrl);
      const allowedDomains = this.configService
        .get<string>('CORS_ORIGINS')
        .split(',')
        .map(domain => {
          try {
            return new URL(domain).hostname;
          } catch {
            return domain;
          }
        });
      return allowedDomains.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.userService.findById(userId); // Phương thức findById trong UserService
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      result: user,
      message: 'Get user info successfully'
    };
  }
}