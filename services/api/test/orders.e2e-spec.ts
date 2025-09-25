import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderStatus, OrderMode, ReceiptCheck } from '../src/orders/dto/order.dto';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userToken: string;
  let shopperToken: string;
  let adminToken: string;
  let userId: string;
  let shopperId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean database
    await prismaService.cleanDb();

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/user')
      .send({
        email: 'user@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      })
      .expect(201);

    userToken = userResponse.body.access_token;
    userId = userResponse.body.user.id;

    // Create test shopper
    const shopperResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/shopper')
      .send({
        email: 'shopper@example.com',
        password: 'password123',
        phone: '+81-90-8765-4321',
      })
      .expect(201);

    shopperToken = shopperResponse.body.access_token;
    shopperId = shopperResponse.body.user.id;

    // Approve shopper KYC for testing
    await prismaService.shopper.update({
      where: { id: shopperId },
      data: {
        kyc_status: 'approved',
        risk_tier: 'L1',
        status: 'active',
      },
    });

    // Create test admin
    const adminResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/user')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      })
      .expect(201);

    await prismaService.admin.create({
      data: {
        id: adminResponse.body.user.id,
        email: 'admin@example.com',
        password_hash: 'dummy',
        role: 'manager',
      },
    });

    adminToken = adminResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/orders (POST)', () => {
    it('should create order successfully', () => {
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
            allow_subs: true,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe(OrderStatus.NEW);
          expect(res.body.mode).toBe(OrderMode.APPROVE);
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].name).toBe('Milk');
        });
    });

    it('should return 400 for invalid order data', () => {
      const invalidOrderDto = {
        mode: 'invalid_mode',
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: -100, // Invalid negative amount
        items: [],
      };

      return request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidOrderDto)
        .expect(400);
    });

    it('should return 401 without token', () => {
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        items: [],
      };

      return request(app.getHttpServer())
        .post('/v1/orders')
        .send(createOrderDto)
        .expect(401);
    });
  });

  describe('/orders/available (GET)', () => {
    it('should return available orders for eligible shopper', async () => {
      // First create an order as user
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      // Then get available orders as shopper
      return request(app.getHttpServer())
        .get('/v1/orders/available')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.orders).toBeDefined();
          expect(Array.isArray(res.body.orders)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should return 403 for non-shopper users', () => {
      return request(app.getHttpServer())
        .get('/v1/orders/available')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/orders/:id/accept (POST)', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create an order first
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
          },
        ],
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      orderId = orderResponse.body.id;
    });

    it('should accept order successfully', () => {
      const acceptOrderDto = {
        note: 'Will complete within 2 hours',
        estimated_completion: '2023-12-01T14:00:00Z',
      };

      return request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(acceptOrderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe(OrderStatus.ACCEPTED);
          expect(res.body.shopper_id).toBe(shopperId);
        });
    });

    it('should return 400 when trying to accept already accepted order', async () => {
      // Accept order first
      await request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({})
        .expect(201);

      // Try to accept again
      return request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({})
        .expect(400);
    });

    it('should return 403 for non-shopper users', () => {
      return request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(403);
    });
  });

  describe('/orders/:id/status (PATCH)', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create and accept an order
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
          },
        ],
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      orderId = orderResponse.body.id;

      // Accept the order
      await request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({})
        .expect(201);
    });

    it('should update order status successfully', () => {
      const updateStatusDto = {
        status: OrderStatus.SHOPPING,
        note: 'Started shopping',
      };

      return request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(updateStatusDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(OrderStatus.SHOPPING);
        });
    });

    it('should return 400 for invalid status transition', () => {
      const updateStatusDto = {
        status: OrderStatus.DELIVERED, // Invalid transition from ACCEPTED
      };

      return request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(updateStatusDto)
        .expect(400);
    });

    it('should return 403 for unauthorized user', () => {
      const updateStatusDto = {
        status: OrderStatus.SHOPPING,
      };

      return request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateStatusDto)
        .expect(403);
    });
  });

  describe('/orders/my-orders (GET)', () => {
    it('should return user orders', async () => {
      // Create an order first
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      // Get user orders
      return request(app.getHttpServer())
        .get('/v1/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.orders).toBeDefined();
          expect(Array.isArray(res.body.orders)).toBe(true);
          expect(res.body.orders.length).toBeGreaterThan(0);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should return 403 for non-user roles', () => {
      return request(app.getHttpServer())
        .get('/v1/orders/my-orders')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(403);
    });
  });

  describe('/orders/:id (GET)', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create an order
      const createOrderDto = {
        mode: OrderMode.APPROVE,
        receipt_check: ReceiptCheck.REQUIRED,
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: 'Milk',
            qty: '1',
            price_min: 200,
            price_max: 300,
          },
        ],
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      orderId = orderResponse.body.id;
    });

    it('should return order details for order owner', () => {
      return request(app.getHttpServer())
        .get(`/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orderId);
          expect(res.body.user_id).toBe(userId);
          expect(res.body.items).toBeDefined();
        });
    });

    it('should return 403 for unauthorized user', () => {
      return request(app.getHttpServer())
        .get(`/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});