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
import { UserSettingsModule } from '../setting/user-settings/user-settings.module';
import { OAuthController } from './oauth.controller';
import { ClientAppModule } from '../client-app/client-app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationCode, AuthorizationCodeSchema } from './authorization-code/authorization-code.schema';
import { AuthorizationCodeService } from './authorization-code/authorization-code.service';

@Module({
  imports: [
    UserModule,
    OtpModule,
    EmailModule,
    UserSettingsModule,
    ClientAppModule,
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
    MongooseModule.forFeature([
      { name: AuthorizationCode.name, schema: AuthorizationCodeSchema }
    ])
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'APP_GUARD',
      useClass: LocalGuard,
    },
    GoogleStrategy,
    AuthorizationCodeService
  ],
  exports: [AuthService, AuthorizationCodeService],
})
export class AuthModule { }