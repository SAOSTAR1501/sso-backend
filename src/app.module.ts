import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

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
    DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
