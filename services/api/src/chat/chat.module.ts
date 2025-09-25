import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { NotificationService } from '../notifications/notification.service';
import { NotificationController } from '../notifications/notification.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatController, NotificationController],
  providers: [ChatService, ChatGateway, NotificationService],
  exports: [ChatService, NotificationService, ChatGateway],
})
export class ChatModule {}