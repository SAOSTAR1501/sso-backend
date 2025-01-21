import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
      },
      tokens,
      redirectTo: redirectUrl ? this.buildRedirectUrl(redirectUrl, tokens) : null,
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

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id,
      email: user.email,
      roles: user.roles
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

    await this.userService.updateRefreshToken(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private validateRedirectUrl(redirectUrl: string): boolean {
    try {
      const url = new URL(redirectUrl);
      const allowedDomains = this.configService
        .get<string>('CORS_ORIGINS')
        .split(',')
        .map(domain => {
          try {
            return new URL(domain).hostname; // Chỉ lấy hostname từ URL
          } catch {
            return domain; // Nếu không phải URL hợp lệ, giữ nguyên
          }
        });
      return allowedDomains.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
    } catch (error) {
      return false;
    }
  }

  private buildRedirectUrl(redirectUrl: string, tokens: { accessToken: string, refreshToken: string }) {
    const url = new URL(redirectUrl);
    // Sử dụng URL fragment thay vì query params để bảo mật token
    url.hash = `access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
    return url.toString();
  }
}