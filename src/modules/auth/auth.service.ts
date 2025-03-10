import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { UserSettingsService } from '../setting/user-settings/user-settings.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly userSettingsService: UserSettingsService
  ) { }

  // async register(registerDto: RegisterDto) {
  //   const redirectUrl = registerDto.redirectUri;
  //   // Validate redirect URL if provided
  //   if (redirectUrl && !this.validateRedirectUrl(redirectUrl)) {
  //     throw new BadRequestException('Invalid redirect URL');
  //   }

  //   // Check if user exists
  //   const existingUser = await this.userService.findByEmail(registerDto.email);
  //   if (existingUser) {
  //     throw new ConflictException('Email already exists');
  //   }

  //   // Hash password and create user
  //   const hashedPassword = await bcrypt.hash(registerDto.password, 10);
  //   const user = await this.userService.create({
  //     email: registerDto.email,
  //     fullName: registerDto.fullName,
  //     password: hashedPassword,
  //     role: 'customer',
  //     avatar: {
  //       url: `https://avatar.iran.liara.run/username?username=${registerDto.fullName}`,
  //       publicId: '',
  //     }
  //   });

  //   try {
  //     await this.emailService.sendWelcomeEmail(user.email, user.fullName);
  //   } catch (error) {
  //     // Log error but don't fail registration if email fails
  //     console.error('Failed to send welcome email:', error);
  //   }

  //   // Generate tokens
  //   const tokens = await this.generateTokens(user);

  //   // Build response
  //   const response = {
  //     user: {
  //       id: user._id,
  //       email: user.email,
  //       fullName: user.fullName,
  //       role: user.role,
  //       avatar: user.avatar
  //     },
  //     tokens,
  //     redirectTo: redirectUrl ? this.buildRedirectUrl(redirectUrl, tokens) : null,
  //   };

  //   return response;
  // }

  async register(registerDto: RegisterDto) {
    const redirectUrl = registerDto.redirectUri;
    console.log({ redirectUrl })
    if (redirectUrl && !this.validateRedirectUrl(redirectUrl)) {
      throw new BadRequestException('Invalid redirect URL');
    }

    console.log( "một")

    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    console.log({existingUser})
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userService.create({
      email: registerDto.email,
      fullName: registerDto.fullName,
      password: hashedPassword,
      role: 'customer',
      avatar: {
        url: `https://avatar.iran.liara.run/username?username=${registerDto.fullName}`,
        publicId: '',
      }
    });

    console.log('User created:', user);  // <-- Xác nhận user tạo thành công chưa

    try {
      await this.emailService.sendWelcomeEmail(user.email, user.fullName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    try {
      const tokens = await this.generateTokens(user);
      console.log('Generated tokens:', tokens);  // <-- Xác nhận tokens tạo thành công chưa

      const response = {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        },
        tokens,
        redirectTo: redirectUrl ? this.buildRedirectUrl(redirectUrl, tokens) : null,
      };

      return response;

    } catch (error) {
      console.error('Error generating tokens:', error);  // <-- Quan trọng, thêm ngay dòng này vào
      throw error;
    }
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
        role: user.role,
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
        role: 'customer',
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
        roles: user.role,
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
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatar?.url || '',
      role: user.role,
      isActive: user.isActive || false
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
    url.hash = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
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
        .map(domain => new URL(domain).hostname);
  
      return allowedDomains.includes(url.hostname);
    } catch (error) {
      console.error('Error validating redirect URL:', error);
      return false;
    }
  }


  async getCurrentUser(userId: string) {
    const user = await this.userService.findById(userId); // Phương thức findById trong UserService
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userSettingsSystem = await this.userSettingsService.getUserSettingsSystem(userId);

    return {
      result: {
        ...user,
        settings: userSettingsSystem
      },
      message: 'Get user info successfully'
    };
  }
}