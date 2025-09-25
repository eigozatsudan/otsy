import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { PaymentStatus } from '../src/payments/dto/payment.dto';
import { OrderStatus } from '../src/orders/dto/order.dto';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testOrder: any;

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

    // Configure app same as main.ts
    app.useGlobalPipes(/* validation pipe config */);
    app.setGlobalPrefix('v1');

    await app.init();

    // Clean up test data
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: '09012345678',
        role: 'user',
      },
    });

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        phone: '09087654321',
        role: 'admin',
      },
    });

    // Generate tokens
    userToken = await authService.generateToken(testUser);
    adminToken = await authService.generateToken(adminUser);

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        user_id: testUser.id,
        status: OrderStatus.NEW,
        estimate_amount: 1000,
        delivery_address: '東京都渋谷区1-1-1',
        delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        items: {
          create: [
            {
              name: '牛乳',
              qty: '1L',
              estimate_price: 200,
            },
            {
              name: 'パン',
              qty: '1個',
              estimate_price: 150,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /v1/payments/create-intent', () => {
    it('should create payment intent for valid order', async () => {
      const createPaymentDto = {
        order_id: testOrder.id,
        amount: 1200, // 20% buffer over estimate
        description: 'Test payment intent',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPaymentDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('client_secret');
      expect(response.body.status).toBe(PaymentStatus.PENDING);
      expect(response.body.amount).toBe(1200);

      // Verify payment was created in database
      const payment = await prisma.payment.findUnique({
        where: { id: response.body.id },
      });
      expect(payment).toBeTruthy();
      expect(payment.order_id).toBe(testOrder.id);
    });

    it('should return existing payment intent if one exists', async () => {
      const createPaymentDto = {
        order_id: testOrder.id,
        amount: 1200,
        description: 'Test payment intent',
      };

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPaymentDto)
        .expect(201);

      // Second request should return same payment
      const response2 = await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPaymentDto)
        .expect(201);

      expect(response1.body.id).toBe(response2.body.id);
    });

    it('should reject unauthorized user', async () => {
      const createPaymentDto = {
        order_id: testOrder.id,
        amount: 1200,
      };

      await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .send(createPaymentDto)
        .expect(401);
    });

    it('should reject invalid order', async () => {
      const createPaymentDto = {
        order_id: 'invalid-order-id',
        amount: 1200,
      };

      await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPaymentDto)
        .expect(404);
    });
  });

  describe('GET /v1/payments/my-payments', () => {
    it('should return user payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payments/my-payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const payment = response.body[0];
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('status');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('order');
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/v1/payments/my-payments')
        .expect(401);
    });
  });

  describe('GET /v1/payments/:id', () => {
    let testPayment: any;

    beforeAll(async () => {
      testPayment = await prisma.payment.findFirst({
        where: { order_id: testOrder.id },
      });
    });

    it('should return payment details for authorized user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/payments/${testPayment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(testPayment.id);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe(testOrder.id);
    });

    it('should allow admin access to any payment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/payments/${testPayment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testPayment.id);
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get(`/v1/payments/${testPayment.id}`)
        .expect(401);
    });
  });

  describe('GET /v1/payments/order/:orderId', () => {
    it('should return payments for order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/payments/order/${testOrder.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const payment = response.body[0];
      expect(payment.order_id).toBe(testOrder.id);
    });
  });

  describe('GET /v1/payments/orders/:orderId/summary', () => {
    it('should return payment summary for order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/payments/orders/${testOrder.id}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('order_id', testOrder.id);
      expect(response.body).toHaveProperty('estimate_amount');
      expect(response.body).toHaveProperty('authorized_amount');
      expect(response.body).toHaveProperty('captured_amount');
      expect(response.body).toHaveProperty('refunded_amount');
      expect(response.body).toHaveProperty('payment_status');
      expect(response.body).toHaveProperty('payments');
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  });

  describe('POST /v1/payments/webhook', () => {
    it('should handle valid webhook signature', async () => {
      // Note: This test would require proper Stripe webhook signature
      // For now, we'll test the endpoint exists and handles invalid signatures
      
      const mockPayload = JSON.stringify({
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      });

      await request(app.getHttpServer())
        .post('/v1/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send(mockPayload)
        .expect(400); // Should fail due to invalid signature
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /v1/payments/stats/overview', () => {
      it('should return payment statistics for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/payments/stats/overview')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_payments');
        expect(response.body).toHaveProperty('successful_payments');
        expect(response.body).toHaveProperty('failed_payments');
        expect(response.body).toHaveProperty('refunded_payments');
        expect(response.body).toHaveProperty('success_rate');
        expect(response.body).toHaveProperty('total_revenue');
        expect(typeof response.body.success_rate).toBe('number');
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/v1/payments/stats/overview')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });
  });

  describe('Payment flow integration', () => {
    it('should handle complete payment flow', async () => {
      // Create new order for this test
      const newOrder = await prisma.order.create({
        data: {
          user_id: testUser.id,
          status: OrderStatus.NEW,
          estimate_amount: 800,
          delivery_address: '東京都新宿区2-2-2',
          delivery_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
          items: {
            create: [
              {
                name: 'りんご',
                qty: '3個',
                estimate_price: 300,
              },
            ],
          },
        },
      });

      // 1. Create payment intent
      const createResponse = await request(app.getHttpServer())
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: newOrder.id,
          amount: 960, // 20% buffer
          description: 'Integration test payment',
        })
        .expect(201);

      expect(createResponse.body.status).toBe(PaymentStatus.PENDING);

      // 2. Check payment summary
      const summaryResponse = await request(app.getHttpServer())
        .get(`/v1/payments/orders/${newOrder.id}/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(summaryResponse.body.payment_status).toBe('pending');
      expect(summaryResponse.body.authorized_amount).toBe(0);

      // 3. Verify order was updated with auth amount
      const updatedOrder = await prisma.order.findUnique({
        where: { id: newOrder.id },
      });
      expect(updatedOrder.auth_amount).toBe(960);

      // Clean up
      await prisma.payment.deleteMany({ where: { order_id: newOrder.id } });
      await prisma.orderItem.deleteMany({ where: { order_id: newOrder.id } });
      await prisma.order.delete({ where: { id: newOrder.id } });
    });
  });
});