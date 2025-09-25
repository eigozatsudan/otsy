import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe (disabled until class-validator is installed)
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   transform: true,
  // }));

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

  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}/v1`);
}

bootstrap();