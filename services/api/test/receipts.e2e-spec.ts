import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderStatus } from '../src/orders/dto/order.dto';
import { ReceiptStatus } from '../src/receipts/dto/receipt.dto';

describe('ReceiptsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userToken: string;
  let shopperToken: string;
  let adminToken: string;
  let userId: string;
  let shopperId: string;
  let orderId: string;

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

    // Approve shopper KYC
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

    // Create and accept an order
    const orderResponse = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mode: 'approve',
        receipt_check: 'required',
        estimate_amount: 1000,
        address_json: {
          street: '1-1-1 Shibuya',
          city: 'Shibuya',
          postal_code: '150-0002',
          prefecture: 'Tokyo',
        },
        items: [
          {
            name: '牛乳',
            qty: '1L',
            price_min: 200,
            price_max: 300,
          },
        ],
      })
      .expect(201);

    orderId = orderResponse.body.id;

    // Accept the order as shopper
    await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${shopperToken}`)
      .send({})
      .expect(201);

    // Update order to shopping status
    await request(app.getHttpServer())
      .patch(`/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${shopperToken}`)
      .send({ status: 'shopping' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/receipts/upload-url (POST)', () => {
    it('should generate upload URL for shopper', () => {
      const requestBody = {
        order_id: orderId,
        file_extension: 'jpg',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts/upload-url')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(requestBody)
        .expect(201)
        .expect((res) => {
          expect(res.body.upload_url).toBeDefined();
          expect(res.body.file_url).toBeDefined();
          expect(res.body.upload_url).toContain('receipts/');
        });
    });

    it('should return 403 for non-shopper users', () => {
      const requestBody = {
        order_id: orderId,
        file_extension: 'jpg',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts/upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestBody)
        .expect(403);
    });

    it('should return 403 for unauthorized shopper', () => {
      const requestBody = {
        order_id: 'other-order-id',
        file_extension: 'jpg',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts/upload-url')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(requestBody)
        .expect(404); // Order not found
    });
  });

  describe('/receipts (POST)', () => {
    it('should submit receipt successfully', () => {
      const submitReceiptDto = {
        order_id: orderId,
        image_url: 'https://example.com/receipt.jpg',
        total_amount: 500,
        store_name: 'Test Store',
        notes: 'Receipt submitted successfully',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitReceiptDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.order_id).toBe(orderId);
          expect(res.body.shopper_id).toBe(shopperId);
          expect(res.body.image_url).toBe(submitReceiptDto.image_url);
        });
    });

    it('should return 400 for invalid order status', async () => {
      // First submit a receipt to change order status
      await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      // Try to submit another receipt
      const submitReceiptDto = {
        order_id: orderId,
        image_url: 'https://example.com/receipt2.jpg',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitReceiptDto)
        .expect(400);
    });

    it('should return 403 for non-shopper users', () => {
      const submitReceiptDto = {
        order_id: orderId,
        image_url: 'https://example.com/receipt.jpg',
      };

      return request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(submitReceiptDto)
        .expect(403);
    });
  });

  describe('/receipts/:id/review (PATCH)', () => {
    let receiptId: string;

    beforeEach(async () => {
      // Submit a receipt first
      const receiptResponse = await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
          total_amount: 500,
        })
        .expect(201);

      receiptId = receiptResponse.body.id;
    });

    it('should approve receipt successfully', () => {
      const reviewDto = {
        status: ReceiptStatus.APPROVED,
        review_notes: 'Receipt looks good',
      };

      return request(app.getHttpServer())
        .patch(`/v1/receipts/${receiptId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(receiptId);
        });
    });

    it('should reject receipt successfully', () => {
      const reviewDto = {
        status: ReceiptStatus.REJECTED,
        review_notes: 'Items do not match order',
      };

      return request(app.getHttpServer())
        .patch(`/v1/receipts/${receiptId}/review`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewDto)
        .expect(200);
    });

    it('should return 403 for non-user roles', () => {
      const reviewDto = {
        status: ReceiptStatus.APPROVED,
        review_notes: 'Looks good',
      };

      return request(app.getHttpServer())
        .patch(`/v1/receipts/${receiptId}/review`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(reviewDto)
        .expect(403);
    });
  });

  describe('/receipts/:id (GET)', () => {
    let receiptId: string;

    beforeEach(async () => {
      // Submit a receipt first
      const receiptResponse = await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      receiptId = receiptResponse.body.id;
    });

    it('should return receipt details for order owner', () => {
      return request(app.getHttpServer())
        .get(`/v1/receipts/${receiptId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(receiptId);
          expect(res.body.order_id).toBe(orderId);
        });
    });

    it('should return receipt details for shopper', () => {
      return request(app.getHttpServer())
        .get(`/v1/receipts/${receiptId}`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(receiptId);
          expect(res.body.shopper_id).toBe(shopperId);
        });
    });

    it('should return 404 for non-existent receipt', () => {
      return request(app.getHttpServer())
        .get('/v1/receipts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('/receipts/:id/view-url (GET)', () => {
    let receiptId: string;

    beforeEach(async () => {
      // Submit a receipt first
      const receiptResponse = await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      receiptId = receiptResponse.body.id;
    });

    it('should generate signed view URL for authorized user', () => {
      return request(app.getHttpServer())
        .get(`/v1/receipts/${receiptId}/view-url`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.signed_url).toBeDefined();
        });
    });
  });

  describe('/receipts/:id/process (POST)', () => {
    let receiptId: string;

    beforeEach(async () => {
      // Submit a receipt first
      const receiptResponse = await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      receiptId = receiptResponse.body.id;
    });

    it('should process receipt image successfully', () => {
      return request(app.getHttpServer())
        .post(`/v1/receipts/${receiptId}/process`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.processed_data).toBeDefined();
          expect(res.body.validation).toBeDefined();
          expect(res.body.summary).toBeDefined();
          expect(res.body.recommendations).toBeDefined();
        });
    });
  });

  describe('/receipts/my-receipts (GET)', () => {
    it('should return shopper receipts', async () => {
      // Submit a receipt first
      await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/v1/receipts/my-receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 403 for non-shopper users', () => {
      return request(app.getHttpServer())
        .get('/v1/receipts/my-receipts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/receipts/stats/overview (GET)', () => {
    it('should return receipt statistics for admin', async () => {
      // Submit a receipt first
      await request(app.getHttpServer())
        .post('/v1/receipts')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          order_id: orderId,
          image_url: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/v1/receipts/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total_receipts).toBeDefined();
          expect(res.body.pending_review).toBeDefined();
          expect(res.body.approved).toBeDefined();
          expect(res.body.rejected).toBeDefined();
          expect(res.body.approval_rate).toBeDefined();
        });
    });

    it('should return 403 for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/v1/receipts/stats/overview')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});