// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/local.strategy';
import { LocalGuard } from './guard/local.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from '../user/user.module';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UserModule,
    OtpModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_ACCESS_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'APP_GUARD',
      useClass: LocalGuard,
    },
    GoogleStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}