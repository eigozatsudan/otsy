import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Otsukai DX Pivot API')
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
  
  // Write OpenAPI spec to file
  const outputPath = join(__dirname, '../../openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
  
  await app.close();
}

generateOpenApiSpec().catch(console.error);
