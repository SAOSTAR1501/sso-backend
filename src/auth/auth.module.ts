import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('CUS_ACCESS_TOKEN_KEY'),
        signOptions: { expiresIn: '1h' }
      }),
      inject: [ConfigService]
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
