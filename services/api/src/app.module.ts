import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShoppersModule } from './shoppers/shoppers.module';
import { OrdersModule } from './orders/orders.module';
import { KycModule } from './kyc/kyc.module';
import { StorageModule } from './storage/storage.module';
import { LlmModule } from './llm/llm.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PaymentsModule } from './payments/payments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './auth/guards/roles.guard';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}