import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { MessageType, ChatStatus } from '../src/chat/dto/chat.dto';
import { OrderStatus } from '../src/orders/dto/order.dto';

describe('Chat System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let userToken: string;
  let shopperToken: string;
  let adminToken: string;
  let testUser: any;
  let testShopper: any;
  let testOrder: any;
  let testChat: any;
  let userSocket: Socket;
  let shopperSocket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
    await app.listen(0); // Use random port for testing

    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: '09012345678',
        role: 'user',
      },
    });

    testShopper = await prisma.user.create({
      data: {
        email: 'shopper@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Shopper',
        phone: '09087654321',
        role: 'shopper',
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        phone: '09011111111',
        role: 'admin',
      },
    });

    // Generate tokens
    userToken = await authService.generateToken(testUser);
    shopperToken = await authService.generateToken(testShopper);
    adminToken = await authService.generateToken(adminUser);

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        user_id: testUser.id,
        shopper_id: testShopper.id,
        status: OrderStatus.ACCEPTED,
        estimate_amount: 1500,
        delivery_address: '東京都渋谷区1-1-1',
        delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              name: '牛乳',
              qty: '1L',
              estimate_price: 200,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up
    if (userSocket) userSocket.disconnect();
    if (shopperSocket) shopperSocket.disconnect();
    
    await prisma.chatMessage.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Chat REST API', () => {
    describe('POST /v1/chat', () => {
      it('should create a new chat for an order', async () => {
        const createChatDto = {
          order_id: testOrder.id,
          user_id: testUser.id,
          shopper_id: testShopper.id,
          initial_message: 'Hello! I\'m ready to start shopping for you.',
        };

        const response = await request(app.getHttpServer())
          .post('/v1/chat')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createChatDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.order_id).toBe(testOrder.id);
        expect(response.body.user_id).toBe(testUser.id);
        expect(response.body.shopper_id).toBe(testShopper.id);
        expect(response.body.status).toBe(ChatStatus.ACTIVE);

        testChat = response.body;
      });

      it('should return existing chat if one already exists for the order', async () => {
        const createChatDto = {
          order_id: testOrder.id,
          user_id: testUser.id,
          shopper_id: testShopper.id,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/chat')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createChatDto)
          .expect(201);

        expect(response.body.id).toBe(testChat.id);
      });
    });

    describe('GET /v1/chat/my-chats', () => {
      it('should return user\'s chats', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/chat/my-chats')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('chats');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.chats)).toBe(true);
        expect(response.body.chats.length).toBeGreaterThan(0);
        
        const chat = response.body.chats[0];
        expect(chat.id).toBe(testChat.id);
      });

      it('should return shopper\'s chats', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/chat/my-chats')
          .set('Authorization', `Bearer ${shopperToken}`)
          .expect(200);

        expect(response.body.chats.length).toBeGreaterThan(0);
        expect(response.body.chats[0].id).toBe(testChat.id);
      });
    });

    describe('GET /v1/chat/:id', () => {
      it('should return chat details for authorized user', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/chat/${testChat.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.id).toBe(testChat.id);
        expect(response.body).toHaveProperty('order');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('shopper');
      });

      it('should allow admin access to any chat', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/chat/${testChat.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(testChat.id);
      });
    });

    describe('POST /v1/chat/:id/messages', () => {
      it('should send a text message', async () => {
        const messageDto = {
          content: 'Hello! I need some help with my order.',
          type: MessageType.TEXT,
        };

        const response = await request(app.getHttpServer())
          .post(`/v1/chat/${testChat.id}/messages`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(messageDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toBe(messageDto.content);
        expect(response.body.type).toBe(MessageType.TEXT);
        expect(response.body.sender_id).toBe(testUser.id);
        expect(response.body.sender_role).toBe('user');
      });

      it('should send an image message', async () => {
        const messageDto = {
          content: 'Here\'s a photo of the item',
          type: MessageType.IMAGE,
          attachment_url: 'https://example.com/image.jpg',
          attachment_type: 'image/jpeg',
        };

        const response = await request(app.getHttpServer())
          .post(`/v1/chat/${testChat.id}/messages`)
          .set('Authorization', `Bearer ${shopperToken}`)
          .send(messageDto)
          .expect(201);

        expect(response.body.type).toBe(MessageType.IMAGE);
        expect(response.body.attachment_url).toBe(messageDto.attachment_url);
        expect(response.body.sender_role).toBe('shopper');
      });
    });

    describe('GET /v1/chat/:id/messages', () => {
      it('should return chat messages', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/chat/${testChat.id}/messages`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('messages');
        expect(response.body).toHaveProperty('hasMore');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.messages)).toBe(true);
        expect(response.body.messages.length).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/chat/${testChat.id}/messages?page=1&limit=1`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.messages.length).toBeLessThanOrEqual(1);
      });
    });

    describe('GET /v1/chat/:id/unread-count', () => {
      it('should return unread message count', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/chat/${testChat.id}/unread-count`)
          .set('Authorization', `Bearer ${shopperToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('unread_count');
        expect(typeof response.body.unread_count).toBe('number');
      });
    });
  });

  describe('WebSocket Communication', () => {
    beforeAll(async () => {
      const serverAddress = await app.getHttpServer().address();
      const port = serverAddress.port;
      
      // Create WebSocket connections
      userSocket = io(`http://localhost:${port}/chat`, {
        auth: { token: userToken },
        transports: ['websocket'],
      });

      shopperSocket = io(`http://localhost:${port}/chat`, {
        auth: { token: shopperToken },
        transports: ['websocket'],
      });

      // Wait for connections
      await Promise.all([
        new Promise((resolve) => userSocket.on('connected', resolve)),
        new Promise((resolve) => shopperSocket.on('connected', resolve)),
      ]);
    });

    it('should establish WebSocket connections', (done) => {
      let connectedCount = 0;
      
      const checkConnections = () => {
        connectedCount++;
        if (connectedCount === 2) {
          expect(userSocket.connected).toBe(true);
          expect(shopperSocket.connected).toBe(true);
          done();
        }
      };

      userSocket.on('connected', checkConnections);
      shopperSocket.on('connected', checkConnections);
    });

    it('should join chat rooms', (done) => {
      let joinedCount = 0;
      
      const checkJoined = () => {
        joinedCount++;
        if (joinedCount === 2) done();
      };

      userSocket.emit('join_chat', { chat_id: testChat.id });
      shopperSocket.emit('join_chat', { chat_id: testChat.id });

      userSocket.on('chat_history', checkJoined);
      shopperSocket.on('chat_history', checkJoined);
    });

    it('should send and receive real-time messages', (done) => {
      const testMessage = {
        content: 'Real-time test message',
        type: MessageType.TEXT,
      };

      shopperSocket.on('new_message', (message) => {
        expect(message.content).toBe(testMessage.content);
        expect(message.sender_role).toBe('user');
        done();
      });

      userSocket.emit('send_message', {
        chatId: testChat.id,
        message: testMessage,
      });
    });

    it('should handle typing indicators', (done) => {
      shopperSocket.on('typing_indicator', (data) => {
        expect(data.action).toBe('start');
        expect(data.chatId).toBe(testChat.id);
        done();
      });

      userSocket.emit('typing_indicator', {
        chat_id: testChat.id,
        action: 'start',
      });
    });

    it('should notify when users join/leave', (done) => {
      const newSocket = io(`http://localhost:${app.getHttpServer().address().port}/chat`, {
        auth: { token: adminToken },
        transports: ['websocket'],
      });

      userSocket.on('user_joined', (data) => {
        expect(data.chatId).toBe(testChat.id);
        expect(data.role).toBe('admin');
        newSocket.disconnect();
        done();
      });

      newSocket.on('connected', () => {
        newSocket.emit('join_chat', { chat_id: testChat.id });
      });
    });
  });

  describe('Push Notifications', () => {
    describe('POST /v1/notifications/subscribe', () => {
      it('should subscribe to push notifications', async () => {
        const subscription = {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/v1/notifications/subscribe')
          .set('Authorization', `Bearer ${userToken}`)
          .send(subscription)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('subscribed');
      });
    });

    describe('GET /v1/notifications/preferences', () => {
      it('should return notification preferences', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/notifications/preferences')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('order_updates');
        expect(response.body).toHaveProperty('chat_messages');
        expect(response.body).toHaveProperty('promotional');
        expect(response.body).toHaveProperty('system_alerts');
      });
    });

    describe('PUT /v1/notifications/preferences', () => {
      it('should update notification preferences', async () => {
        const preferences = {
          order_updates: true,
          chat_messages: true,
          promotional: false,
          system_alerts: true,
        };

        const response = await request(app.getHttpServer())
          .put('/v1/notifications/preferences')
          .set('Authorization', `Bearer ${userToken}`)
          .send(preferences)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /v1/notifications/vapid-public-key', () => {
      it('should return VAPID public key', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/notifications/vapid-public-key')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('publicKey');
      });
    });
  });

  describe('Admin Features', () => {
    describe('GET /v1/chat/admin/stats', () => {
      it('should return chat statistics for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/chat/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_chats');
        expect(response.body).toHaveProperty('active_chats');
        expect(response.body).toHaveProperty('closed_chats');
        expect(response.body).toHaveProperty('total_messages');
        expect(response.body).toHaveProperty('avg_messages_per_chat');
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/v1/chat/admin/stats')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/notifications/admin/stats', () => {
      it('should return notification statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/notifications/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_notifications');
        expect(response.body).toHaveProperty('notifications_today');
        expect(response.body).toHaveProperty('active_subscriptions');
        expect(response.body).toHaveProperty('notifications_by_type');
      });
    });
  });

  describe('Integration with Orders', () => {
    it('should create chat automatically when order is accepted', async () => {
      // This would typically be triggered by the order service
      const response = await request(app.getHttpServer())
        .get(`/v1/chat/order/${testOrder.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.order_id).toBe(testOrder.id);
    });

    it('should send order update notifications', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/notifications/order-status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testOrder.id,
          status: 'shopping',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});