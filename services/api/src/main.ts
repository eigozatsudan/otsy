import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });

  // Configure raw body for Stripe webhooks
  app.use('/v1/payments/webhook', json({ verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }}));
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://user.otsukai.app', 'https://shopper.otsukai.app', 'https://admin.otsukai.app']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('v1');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Otsukai DX API')
    .setDescription('おつかいDXプラットフォームのAPI仕様書')
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
    .addTag('Shoppers', '買い物代行者管理')
    .addTag('Orders', '注文管理')
    .addTag('KYC', '本人確認')
    .addTag('Storage', 'ファイルストレージ')
    .addTag('LLM', '音声・自然言語処理')
    .addTag('Receipts', 'レシート管理')
    .addTag('Payments', '決済管理')
    .addTag('Chat', 'チャット・リアルタイム通信')
    .addTag('Notifications', 'プッシュ通知')
    .addTag('Subscriptions', 'サブスクリプション管理')
    .addTag('Matching', 'マッチングシステム')
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
  console.log(`💳 Stripe webhooks: http://${host}:${port}/v1/payments/webhook`);
}

bootstrap();