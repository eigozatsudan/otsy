import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { SubscriptionTier, SubscriptionStatus, ServiceCreditReason } from '../src/subscriptions/dto/subscription.dto';
import { OrderStatus } from '../src/orders/dto/order.dto';

describe('Subscription and Matching System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let userToken: string;
  let shopperToken: string;
  let adminToken: string;
  let testUser: any;
  let testShopper: any;
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

    await app.init();

    // Clean up test data
    await prisma.serviceCredit.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'user@subscription-test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: '09012345678',
        role: 'user',
      },
    });

    testShopper = await prisma.user.create({
      data: {
        email: 'shopper@subscription-test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Shopper',
        phone: '09087654321',
        role: 'shopper',
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@subscription-test.com',
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

    // Create shopper profile
    await prisma.shopperProfile.create({
      data: {
        user_id: testShopper.id,
        bio: 'Experienced shopper',
        experience_years: 2,
        average_rating: 4.5,
        total_ratings: 10,
      },
    });

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        user_id: testUser.id,
        status: OrderStatus.NEW,
        estimate_amount: 2000,
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
    await prisma.serviceCredit.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Subscription Management', () => {
    describe('GET /v1/subscriptions/my-subscription', () => {
      it('should return default free subscription for new user', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.tier).toBe(SubscriptionTier.FREE);
        expect(response.body.status).toBe(SubscriptionStatus.ACTIVE);
        expect(response.body.monthly_fee).toBe(0);
        expect(response.body.benefits).toHaveProperty('priority_matching', false);
        expect(response.body.benefits).toHaveProperty('max_concurrent_orders', 1);
      });
    });

    describe('POST /v1/subscriptions', () => {
      it('should create a basic subscription', async () => {
        const createDto = {
          tier: SubscriptionTier.BASIC,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createDto)
          .expect(201);

        expect(response.body.tier).toBe(SubscriptionTier.BASIC);
        expect(response.body.status).toBe(SubscriptionStatus.ACTIVE);
        expect(response.body.monthly_fee).toBe(980);
        expect(response.body.benefits.priority_matching).toBe(true);
        expect(response.body.benefits.guaranteed_time_slots).toBe(4);
        expect(response.body.benefits.max_concurrent_orders).toBe(2);
      });

      it('should reject creating duplicate subscription', async () => {
        const createDto = {
          tier: SubscriptionTier.PREMIUM,
        };

        await request(app.getHttpServer())
          .post('/v1/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createDto)
          .expect(400);
      });
    });

    describe('PUT /v1/subscriptions/my-subscription', () => {
      it('should upgrade subscription to premium', async () => {
        const updateDto = {
          tier: SubscriptionTier.PREMIUM,
        };

        const response = await request(app.getHttpServer())
          .put('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.tier).toBe(SubscriptionTier.PREMIUM);
        expect(response.body.monthly_fee).toBe(1980);
        expect(response.body.benefits.premium_shoppers).toBe(true);
        expect(response.body.benefits.dedicated_support).toBe(true);
        expect(response.body.benefits.guaranteed_time_slots).toBe(12);
      });
    });

    describe('GET /v1/subscriptions/tiers', () => {
      it('should return all subscription tiers', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/tiers')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.tiers).toHaveLength(4);
        expect(response.body.tiers[0].tier).toBe('free');
        expect(response.body.tiers[1].tier).toBe('basic');
        expect(response.body.tiers[2].tier).toBe('premium');
        expect(response.body.tiers[3].tier).toBe('vip');
      });
    });
  });

  describe('Service Credits', () => {
    describe('GET /v1/subscriptions/service-credits', () => {
      it('should return user service credits', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/service-credits')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('credits');
        expect(response.body).toHaveProperty('total_balance');
        expect(Array.isArray(response.body.credits)).toBe(true);
        expect(response.body.total_balance).toBeGreaterThan(0); // Welcome bonus
      });
    });

    describe('POST /v1/subscriptions/admin/service-credits/:userId', () => {
      it('should add service credit as admin', async () => {
        const creditDto = {
          amount: 1000,
          reason: ServiceCreditReason.COMPENSATION,
          description: 'Test compensation credit',
        };

        const response = await request(app.getHttpServer())
          .post(`/v1/subscriptions/admin/service-credits/${testUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(creditDto)
          .expect(201);

        expect(response.body.amount).toBe(1500); // 1000 * 1.5 (premium multiplier)
        expect(response.body.original_amount).toBe(1000);
        expect(response.body.reason).toBe(ServiceCreditReason.COMPENSATION);
      });
    });

    describe('POST /v1/subscriptions/service-credits/use', () => {
      it('should use service credits for order', async () => {
        const useDto = {
          order_id: testOrder.id,
          amount: 500,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions/service-credits/use')
          .set('Authorization', `Bearer ${userToken}`)
          .send(useDto)
          .expect(201);

        expect(response.body.amount_used).toBe(500);
        expect(response.body.credits_used).toHaveLength(1);
        expect(response.body.remaining_balance).toBeGreaterThan(0);
      });
    });
  });

  describe('Subscription Benefits', () => {
    describe('GET /v1/subscriptions/benefits/check/:feature', () => {
      it('should check premium shopper access', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/benefits/check/premium_shoppers')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.feature).toBe('premium_shoppers');
        expect(response.body.has_access).toBe(true); // Premium subscription
      });
    });

    describe('GET /v1/subscriptions/benefits/limit/:benefit', () => {
      it('should return guaranteed time slots limit', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/benefits/limit/guaranteed_time_slots')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.benefit).toBe('guaranteed_time_slots');
        expect(response.body.limit).toBe(12); // Premium tier
      });
    });

    describe('GET /v1/subscriptions/concurrent-orders/check', () => {
      it('should check concurrent order limit', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/concurrent-orders/check')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('allowed');
        expect(response.body).toHaveProperty('current');
        expect(response.body).toHaveProperty('limit');
        expect(response.body.limit).toBe(3); // Premium tier
      });
    });
  });

  describe('Matching System', () => {
    describe('PUT /v1/matching/shopper/preferences', () => {
      it('should update shopper preferences', async () => {
        const preferences = {
          max_distance_km: 15,
          max_concurrent_orders: 3,
          preferred_store_chains: ['セブンイレブン', 'ファミリーマート'],
          min_order_value: 1000,
          accepts_premium_orders: true,
          working_hours: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
          },
        };

        const response = await request(app.getHttpServer())
          .put('/v1/matching/shopper/preferences')
          .set('Authorization', `Bearer ${shopperToken}`)
          .send(preferences)
          .expect(200);

        expect(response.body.max_distance_km).toBe(15);
        expect(response.body.accepts_premium_orders).toBe(true);
        expect(response.body.working_hours.monday.start).toBe('09:00');
      });
    });

    describe('GET /v1/matching/shopper/preferences', () => {
      it('should return shopper preferences', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/matching/shopper/preferences')
          .set('Authorization', `Bearer ${shopperToken}`)
          .expect(200);

        expect(response.body.max_distance_km).toBe(15);
        expect(response.body.preferred_store_chains).toContain('セブンイレブン');
      });
    });

    describe('POST /v1/matching/admin/find-match/:orderId', () => {
      it('should find best shopper for order', async () => {
        const response = await request(app.getHttpServer())
          .post(`/v1/matching/admin/find-match/${testOrder.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(response.body.order_id).toBe(testOrder.id);
        expect(response.body).toHaveProperty('matched_shopper_id');
        expect(response.body).toHaveProperty('success');
      });
    });

    describe('POST /v1/matching/ratings', () => {
      it('should rate shopper performance', async () => {
        // First, update order status to delivered
        await prisma.order.update({
          where: { id: testOrder.id },
          data: { 
            status: OrderStatus.DELIVERED,
            shopper_id: testShopper.id,
          },
        });

        const ratingDto = {
          order_id: testOrder.id,
          rating: 5,
          comment: 'Excellent service!',
          would_recommend: true,
          rating_categories: {
            communication: 5,
            item_quality: 5,
            timeliness: 4,
            professionalism: 5,
          },
        };

        const response = await request(app.getHttpServer())
          .post('/v1/matching/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send(ratingDto)
          .expect(201);

        expect(response.body.rating).toBe(5);
        expect(response.body.comment).toBe('Excellent service!');
        expect(response.body.shopper_id).toBe(testShopper.id);
      });
    });

    describe('POST /v1/matching/time-slot-guarantee', () => {
      it('should request time slot guarantee', async () => {
        const guaranteeDto = {
          requested_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          time_slot: '10:00-12:00',
          special_instructions: 'Please deliver to front door',
        };

        const response = await request(app.getHttpServer())
          .post('/v1/matching/time-slot-guarantee')
          .set('Authorization', `Bearer ${userToken}`)
          .send(guaranteeDto)
          .expect(201);

        expect(response.body.time_slot).toBe('10:00-12:00');
        expect(response.body.status).toBe('ACTIVE');
        expect(response.body.user_id).toBe(testUser.id);
      });
    });
  });

  describe('Admin Features', () => {
    describe('GET /v1/subscriptions/admin/stats', () => {
      it('should return subscription statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_subscribers');
        expect(response.body).toHaveProperty('subscribers_by_tier');
        expect(response.body).toHaveProperty('monthly_revenue');
        expect(response.body).toHaveProperty('service_credits_issued');
        expect(response.body.total_subscribers).toBeGreaterThan(0);
      });

      it('should reject non-admin access', async () => {
        await request(app.getHttpServer())
          .get('/v1/subscriptions/admin/stats')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/matching/admin/stats', () => {
      it('should return matching statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/matching/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_matches');
        expect(response.body).toHaveProperty('successful_matches');
        expect(response.body).toHaveProperty('success_rate');
        expect(response.body).toHaveProperty('avg_matching_score');
      });
    });

    describe('POST /v1/subscriptions/admin/sla-violation', () => {
      it('should handle SLA violation', async () => {
        const violationDto = {
          order_id: testOrder.id,
          violation_type: 'delivery_delay',
          compensation_amount: 500,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions/admin/sla-violation')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(violationDto)
          .expect(201);

        expect(response.body.violation_type).toBe('delivery_delay');
        expect(response.body.compensation_amount).toBe(500);
        expect(response.body.order_id).toBe(testOrder.id);
      });
    });
  });

  describe('Subscription Lifecycle', () => {
    describe('DELETE /v1/subscriptions/my-subscription', () => {
      it('should cancel subscription', async () => {
        const response = await request(app.getHttpServer())
          .delete('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ reason: 'No longer needed' })
          .expect(200);

        expect(response.body.status).toBe(SubscriptionStatus.CANCELLED);
        expect(response.body.cancellation_reason).toBe('No longer needed');
      });
    });
  });
});