import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './docs/swagger';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Security middlewares
  app.use(helmet());
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const corsConfig = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: corsConfig,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // app.use(
  //   session({
  //     secret: configService.get('SESSION_SECRET'),
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       secure: process.env.NODE_ENV === 'production',
  //       httpOnly: true,
  //       maxAge: 1000 * 60 * 60 * 24 // 24 hours
  //     }
  //   })
  // );

  // API prefix
  app.setGlobalPrefix('api');


  setupSwagger(app);

  const port = configService.get('PORT') || 8080;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();