import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShoppersModule } from './shoppers/shoppers.module';
import { OrdersModule } from './orders/orders.module';
import { KycModule } from './kyc/kyc.module';
import { StorageModule } from './storage/storage.module';
import { LlmModule } from './llm/llm.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PaymentsModule } from './payments/payments.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notifications/notification.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ShoppersModule,
    OrdersModule,
    KycModule,
    StorageModule,
    LlmModule,
    ReceiptsModule,
    PaymentsModule,
    ChatModule,
    NotificationModule,
    SubscriptionModule,
    MatchingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}