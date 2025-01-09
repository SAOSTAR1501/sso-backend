import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    console.log({ user });
    if (user && bcrypt.compareSync(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, res: any) {
    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Access Token sống 15 phút
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // Refresh Token sống 7 ngày
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Đặt true nếu dùng HTTPS
      sameSite: 'none', // Chỉ cho phép cookie từ cùng origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    return {
      accessToken
    };
  }

  async signup(userData: { username: string; email: string; password: string }) {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    await this.userService.create({
      ...userData,
      password: hashedPassword,
    });
  }

  // Xử lý quên mật khẩu
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      // Thực hiện gửi email tại đây (giả sử gửi token reset password)
      console.log(`Sending reset password link to ${email}`);
    }
  }

  async refreshToken(cookie: string, res: any) {
    if (!cookie) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const decoded = this.jwtService.verify(cookie);
      const user = await this.userService.findById(decoded.sub);

      if (!user || user.refreshToken !== cookie) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Tạo Access Token mới
      const payload = { username: user.username, sub: user._id };
      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
      });

      // Tạo Refresh Token mới và lưu lại
      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      await this.userService.updateRefreshToken(user._id.toString(), newRefreshToken);

      // Lưu Refresh Token mới vào HttpOnly Cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
