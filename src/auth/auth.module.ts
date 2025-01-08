import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'your-secret-key', // Dùng biến môi trường
      signOptions: { expiresIn: '1h' },
    }),
    UserModule
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
