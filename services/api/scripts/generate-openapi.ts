import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule);
  
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
  
  // Write OpenAPI spec to file
  const outputPath = join(__dirname, '../../openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
  
  await app.close();
}

generateOpenApiSpec().catch(console.error);
