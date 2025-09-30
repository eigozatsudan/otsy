import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';
import { NotificationService } from '../notifications/notification.service';
import { NotificationController } from '../notifications/notification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    ChatController, 
    MessagesController, 
    RealtimeController, 
    NotificationController
  ],
  providers: [
    ChatService, 
    MessagesService, 
    RealtimeService, 
    ChatGateway, 
    NotificationService
  ],
  exports: [
    ChatService, 
    MessagesService, 
    RealtimeService, 
    NotificationService, 
    ChatGateway
  ],
})
export class ChatModule {}