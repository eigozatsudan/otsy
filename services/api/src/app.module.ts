import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { PrivacyAuthModule } from './auth/privacy-auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ShoppingItemsModule } from './shopping-items/shopping-items.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SplitsModule } from './splits/splits.module';
import { OrdersModule } from './orders/orders.module';
import { StorageModule } from './storage/storage.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notifications/notification.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    PrivacyAuthModule,
    UsersModule,
    GroupsModule,
    ShoppingItemsModule,
    PurchasesModule,
    SplitsModule,
    OrdersModule,
    StorageModule,
    ReceiptsModule,
    ChatModule,
    NotificationModule,
    ItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}