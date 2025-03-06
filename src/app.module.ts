import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { OtpModule } from './modules/otp/otp.module';
import { SettingCategoryModule } from './modules/setting/setting-category/setting-category.module';
import { SettingsModule } from './modules/setting/settings/settings.module';
import { UserSettingsModule } from './modules/setting/user-settings/user-settings.module';
import { UserModule } from './modules/user/user.module';
import { ClientAppModule } from './modules/client-app/client-app.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Để ConfigService có thể sử dụng toàn cục
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
      ],
    }),
    AuthModule,
    UserModule,
    DatabaseModule,
    OtpModule,
    EmailModule,
    SettingCategoryModule,
    SettingsModule,
    UserSettingsModule,
    ClientAppModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
