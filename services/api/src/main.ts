import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // Configure JSON parsing
  app.use(json());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://otsy.app']
      : ['http://localhost:3000'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('v1');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Otsy API')
    .setDescription('家庭・友人グループ向け買い物共同管理アプリのAPI仕様書')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'ヘルスチェック')
    .addTag('Auth', '認証・認可')
    .addTag('Users', 'ユーザー管理')
    .addTag('Groups', 'グループ管理')
    .addTag('Items', 'アイテム管理')
    .addTag('Purchases', '購入記録')
    .addTag('Storage', 'ファイルストレージ')
    .addTag('Receipts', 'レシート管理')
    .addTag('Chat', 'チャット・リアルタイム通信')
    .addTag('Notifications', 'プッシュ通知')
    .addTag('Ads', '広告管理')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);
  console.log(`🚀 API server running on http://${host}:${port}/v1`);
  console.log(`📚 API Documentation: http://${host}:${port}/api`);
}

bootstrap();