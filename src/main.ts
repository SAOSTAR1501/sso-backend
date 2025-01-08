// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  app.enableCors({
    origin: ['http://localhost:4000'], // Chỉ cho phép Mini App
    credentials: true,
  });

  // Cấu hình đường dẫn tới thư mục views
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.use(cookieParser());

  await app.listen(port);
  console.log(`Auth server is running on: http://localhost:${port}`);
}
bootstrap();