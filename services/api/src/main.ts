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

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);
  console.log(`🚀 API server running on http://${host}:${port}/v1`);
  console.log(`💳 Stripe webhooks: http://${host}:${port}/v1/payments/webhooks/stripe`);
}

bootstrap();