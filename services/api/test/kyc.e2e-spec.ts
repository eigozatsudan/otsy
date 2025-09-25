import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { KycDocumentKind, KycStatus } from '../src/kyc/dto/kyc.dto';

describe('KycController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let shopperToken: string;
  let adminToken: string;
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

    // Create test shopper
    const shopperResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/shopper')
      .send({
        email: 'shopper@example.com',
        password: 'password123',
        phone: '+81-90-1234-5678',
      })
      .expect(201);

    shopperToken = shopperResponse.body.access_token;
    shopperId = shopperResponse.body.user.id;

    // Create test admin
    const adminResponse = await request(app.getHttpServer())
      .post('/v1/auth/register/user')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      })
      .expect(201);

    // Manually update user to admin (in real app, this would be done through admin registration)
    await prismaService.admin.create({
      data: {
        id: adminResponse.body.user.id,
        email: 'admin@example.com',
        password_hash: 'dummy', // Not used since we have token
        role: 'manager',
      },
    });

    adminToken = adminResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/kyc/sessions (POST)', () => {
    it('should start KYC session for shopper', () => {
      return request(app.getHttpServer())
        .post('/v1/kyc/sessions')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.session_id).toBeDefined();
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/v1/kyc/sessions')
        .expect(401);
    });
  });

  describe('/kyc/upload (POST)', () => {
    it('should generate upload URL for shopper', () => {
      return request(app.getHttpServer())
        .post('/v1/kyc/upload')
        .query({ kind: KycDocumentKind.ID_FRONT })
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.upload_url).toBeDefined();
          expect(res.body.file_url).toBeDefined();
        });
    });

    it('should return 400 for invalid document kind', () => {
      return request(app.getHttpServer())
        .post('/v1/kyc/upload')
        .query({ kind: 'invalid_kind' })
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(400);
    });
  });

  describe('/kyc/submit (POST)', () => {
    it('should submit KYC with all required documents', () => {
      const submitDto = {
        session_id: shopperId,
        documents: [
          {
            kind: KycDocumentKind.ID_FRONT,
            image_url: 'https://example.com/id-front.jpg',
          },
          {
            kind: KycDocumentKind.ID_BACK,
            image_url: 'https://example.com/id-back.jpg',
          },
          {
            kind: KycDocumentKind.SELFIE,
            image_url: 'https://example.com/selfie.jpg',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/v1/kyc/submit')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('KYC submitted successfully');
        });
    });

    it('should return 400 for missing required documents', () => {
      const submitDto = {
        session_id: shopperId,
        documents: [
          {
            kind: KycDocumentKind.ID_FRONT,
            image_url: 'https://example.com/id-front.jpg',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/v1/kyc/submit')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitDto)
        .expect(400);
    });
  });

  describe('/kyc/result (GET)', () => {
    it('should return KYC result for shopper', async () => {
      // First submit KYC
      const submitDto = {
        session_id: shopperId,
        documents: [
          {
            kind: KycDocumentKind.ID_FRONT,
            image_url: 'https://example.com/id-front.jpg',
          },
          {
            kind: KycDocumentKind.ID_BACK,
            image_url: 'https://example.com/id-back.jpg',
          },
          {
            kind: KycDocumentKind.SELFIE,
            image_url: 'https://example.com/selfie.jpg',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/v1/kyc/submit')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitDto)
        .expect(201);

      // Then get result
      return request(app.getHttpServer())
        .get('/v1/kyc/result')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(KycStatus.PENDING);
          expect(res.body.submitted_at).toBeDefined();
        });
    });
  });

  describe('/kyc/pending (GET)', () => {
    it('should return pending KYC reviews for admin', async () => {
      // First submit KYC as shopper
      const submitDto = {
        session_id: shopperId,
        documents: [
          {
            kind: KycDocumentKind.ID_FRONT,
            image_url: 'https://example.com/id-front.jpg',
          },
          {
            kind: KycDocumentKind.ID_BACK,
            image_url: 'https://example.com/id-back.jpg',
          },
          {
            kind: KycDocumentKind.SELFIE,
            image_url: 'https://example.com/selfie.jpg',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/v1/kyc/submit')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitDto)
        .expect(201);

      // Then get pending reviews as admin
      return request(app.getHttpServer())
        .get('/v1/kyc/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].kyc_status).toBe(KycStatus.PENDING);
        });
    });

    it('should return 403 for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/v1/kyc/pending')
        .set('Authorization', `Bearer ${shopperToken}`)
        .expect(403);
    });
  });

  describe('/kyc/review/:shopperId (PATCH)', () => {
    it('should allow admin to approve KYC', async () => {
      // First submit KYC as shopper
      const submitDto = {
        session_id: shopperId,
        documents: [
          {
            kind: KycDocumentKind.ID_FRONT,
            image_url: 'https://example.com/id-front.jpg',
          },
          {
            kind: KycDocumentKind.ID_BACK,
            image_url: 'https://example.com/id-back.jpg',
          },
          {
            kind: KycDocumentKind.SELFIE,
            image_url: 'https://example.com/selfie.jpg',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/v1/kyc/submit')
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(submitDto)
        .expect(201);

      // Then approve as admin
      const reviewDto = {
        status: KycStatus.APPROVED,
        risk_tier: 'L1',
        notes: 'All documents verified',
      };

      return request(app.getHttpServer())
        .patch(`/v1/kyc/review/${shopperId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reviewDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('KYC review completed');
        });
    });

    it('should return 403 for non-admin users', () => {
      const reviewDto = {
        status: KycStatus.APPROVED,
        risk_tier: 'L1',
      };

      return request(app.getHttpServer())
        .patch(`/v1/kyc/review/${shopperId}`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send(reviewDto)
        .expect(403);
    });
  });
});