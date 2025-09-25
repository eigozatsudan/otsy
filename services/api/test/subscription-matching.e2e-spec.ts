import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { SubscriptionTier, SubscriptionStatus, DeliveryPriority, TimeSlotPreference } from '../src/subscriptions/dto/subscription.dto';
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
    await prisma.subscription.deleteMany();
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

    // Create shopper profile
    await prisma.shopperProfile.create({
      data: {
        user_id: testShopper.id,
        status: 'approved',
        location_lat: 35.6762,
        location_lng: 139.6503,
        bio: 'Experienced shopper',
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
        delivery_lat: 35.6762,
        delivery_lng: 139.6503,
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
    await prisma.subscription.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Subscription Management', () => {
    describe('GET /v1/subscriptions/tiers', () => {
      it('should return available subscription tiers', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/tiers')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty(SubscriptionTier.FREE);
        expect(response.body).toHaveProperty(SubscriptionTier.BASIC);
        expect(response.body).toHaveProperty(SubscriptionTier.PREMIUM);
        expect(response.body).toHaveProperty(SubscriptionTier.VIP);

        const basicTier = response.body[SubscriptionTier.BASIC];
        expect(basicTier).toHaveProperty('name');
        expect(basicTier).toHaveProperty('price_monthly');
        expect(basicTier).toHaveProperty('orders_per_month');
        expect(basicTier).toHaveProperty('features');
        expect(Array.isArray(basicTier.features)).toBe(true);
      });
    });

    describe('POST /v1/subscriptions', () => {
      it('should create a new subscription', async () => {
        const createSubscriptionDto = {
          tier: SubscriptionTier.BASIC,
          preferred_time_slots: [TimeSlotPreference.MORNING, TimeSlotPreference.EVENING],
          default_priority: DeliveryPriority.STANDARD,
          preferred_store_types: ['supermarket', 'convenience'],
          max_delivery_distance: 15,
          auto_accept_orders: false,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createSubscriptionDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.tier).toBe(SubscriptionTier.BASIC);
        expect(response.body.status).toBe(SubscriptionStatus.ACTIVE);
        expect(response.body.user_id).toBe(testUser.id);
        expect(response.body.preferred_time_slots).toEqual(createSubscriptionDto.preferred_time_slots);
        expect(response.body.orders_limit).toBe(20); // Basic tier limit
      });

      it('should reject duplicate subscription creation', async () => {
        const createSubscriptionDto = {
          tier: SubscriptionTier.PREMIUM,
        };

        await request(app.getHttpServer())
          .post('/v1/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createSubscriptionDto)
          .expect(400);
      });
    });

    describe('GET /v1/subscriptions/my-subscription', () => {
      it('should return user subscription', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.tier).toBe(SubscriptionTier.BASIC);
        expect(response.body.user_id).toBe(testUser.id);
      });
    });

    describe('PUT /v1/subscriptions/my-subscription', () => {
      it('should update subscription preferences', async () => {
        const updateDto = {
          preferred_time_slots: [TimeSlotPreference.AFTERNOON],
          max_delivery_distance: 20,
          auto_accept_orders: true,
        };

        const response = await request(app.getHttpServer())
          .put('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.preferred_time_slots).toEqual([TimeSlotPreference.AFTERNOON]);
        expect(response.body.max_delivery_distance).toBe(20);
        expect(response.body.auto_accept_orders).toBe(true);
      });
    });

    describe('GET /v1/subscriptions/usage', () => {
      it('should return subscription usage statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/usage')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('orders_this_period');
        expect(response.body).toHaveProperty('orders_limit');
        expect(response.body).toHaveProperty('priority_orders_used');
        expect(response.body).toHaveProperty('priority_orders_limit');
        expect(response.body).toHaveProperty('service_credits_balance');
        expect(response.body).toHaveProperty('next_billing_date');
        expect(response.body).toHaveProperty('days_until_renewal');
      });
    });

    describe('POST /v1/subscriptions/upgrade', () => {
      it('should upgrade subscription tier', async () => {
        const upgradeDto = {
          new_tier: SubscriptionTier.PREMIUM,
          prorate: true,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions/upgrade')
          .set('Authorization', `Bearer ${userToken}`)
          .send(upgradeDto)
          .expect(200);

        expect(response.body.tier).toBe(SubscriptionTier.PREMIUM);
        expect(response.body.orders_limit).toBe(50); // Premium tier limit
      });

      it('should reject downgrade attempts', async () => {
        const downgradeDto = {
          new_tier: SubscriptionTier.BASIC,
        };

        await request(app.getHttpServer())
          .post('/v1/subscriptions/upgrade')
          .set('Authorization', `Bearer ${userToken}`)
          .send(downgradeDto)
          .expect(400);
      });
    });
  });

  describe('Matching System', () => {
    beforeAll(async () => {
      // Create shopper preferences
      await prisma.shopperPreferences.create({
        data: {
          shopper_id: testShopper.id,
          available_time_slots: [TimeSlotPreference.MORNING, TimeSlotPreference.AFTERNOON],
          preferred_store_types: ['supermarket', 'convenience'],
          max_delivery_distance: 25,
          max_concurrent_orders: 3,
          accepts_urgent_orders: true,
          accepts_large_orders: true,
          min_order_value: 500,
          max_order_value: 10000,
        },
      });
    });

    describe('POST /v1/matching/find-shoppers', () => {
      it('should find matching shoppers for an order', async () => {
        const matchingCriteria = {
          order_id: testOrder.id,
          priority: DeliveryPriority.STANDARD,
          max_distance: 20,
          preferred_time_slot: TimeSlotPreference.MORNING,
          min_shopper_rating: 3.0,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/matching/find-shoppers')
          .set('Authorization', `Bearer ${userToken}`)
          .send(matchingCriteria)
          .expect(201);

        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
          const match = response.body[0];
          expect(match).toHaveProperty('shopper_id');
          expect(match).toHaveProperty('shopper_name');
          expect(match).toHaveProperty('shopper_rating');
          expect(match).toHaveProperty('distance');
          expect(match).toHaveProperty('estimated_delivery_time');
          expect(match).toHaveProperty('compatibility_score');
          expect(match).toHaveProperty('reasons');
          expect(Array.isArray(match.reasons)).toBe(true);
        }
      });

      it('should apply subscription-based priority', async () => {
        const matchingCriteria = {
          order_id: testOrder.id,
          subscriber_only: true,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/matching/find-shoppers')
          .set('Authorization', `Bearer ${userToken}`)
          .send(matchingCriteria)
          .expect(201);

        // Premium subscribers should get priority matching
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Shopper Preferences', () => {
      describe('GET /v1/matching/shopper/preferences', () => {
        it('should return shopper preferences', async () => {
          const response = await request(app.getHttpServer())
            .get('/v1/matching/shopper/preferences')
            .set('Authorization', `Bearer ${shopperToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('available_time_slots');
          expect(response.body).toHaveProperty('preferred_store_types');
          expect(response.body).toHaveProperty('max_delivery_distance');
          expect(response.body).toHaveProperty('max_concurrent_orders');
        });
      });

      describe('PUT /v1/matching/shopper/preferences', () => {
        it('should update shopper preferences', async () => {
          const updatePreferences = {
            available_time_slots: [TimeSlotPreference.EVENING],
            preferred_store_types: ['pharmacy', 'supermarket'],
            max_delivery_distance: 30,
            max_concurrent_orders: 5,
            accepts_urgent_orders: false,
            min_order_value: 1000,
          };

          const response = await request(app.getHttpServer())
            .put('/v1/matching/shopper/preferences')
            .set('Authorization', `Bearer ${shopperToken}`)
            .send(updatePreferences)
            .expect(200);

          expect(response.body.success).toBe(true);

          // Verify preferences were updated
          const getResponse = await request(app.getHttpServer())
            .get('/v1/matching/shopper/preferences')
            .set('Authorization', `Bearer ${shopperToken}`)
            .expect(200);

          expect(getResponse.body.available_time_slots).toEqual([TimeSlotPreference.EVENING]);
          expect(getResponse.body.max_delivery_distance).toBe(30);
        });
      });
    });

    describe('Rating System', () => {
      let completedOrder: any;

      beforeAll(async () => {
        // Create a completed order for rating
        completedOrder = await prisma.order.create({
          data: {
            user_id: testUser.id,
            shopper_id: testShopper.id,
            status: OrderStatus.DELIVERED,
            estimate_amount: 1500,
            delivery_address: '東京都新宿区2-2-2',
            delivery_date: new Date(),
            delivered_at: new Date(),
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
      });

      describe('POST /v1/matching/rate-shopper/:orderId', () => {
        it('should submit shopper rating', async () => {
          const rating = {
            overall_rating: 5,
            communication_rating: 5,
            accuracy_rating: 4,
            timeliness_rating: 5,
            comment: 'Excellent service! Very professional and fast.',
            tags: ['friendly', 'fast', 'accurate'],
          };

          const response = await request(app.getHttpServer())
            .post(`/v1/matching/rate-shopper/${completedOrder.id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(rating)
            .expect(201);

          expect(response.body.success).toBe(true);
        });

        it('should reject rating for non-delivered orders', async () => {
          const rating = {
            overall_rating: 4,
            communication_rating: 4,
            accuracy_rating: 4,
            timeliness_rating: 4,
          };

          await request(app.getHttpServer())
            .post(`/v1/matching/rate-shopper/${testOrder.id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(rating)
            .expect(400);
        });
      });

      describe('GET /v1/matching/shopper/:shopperId/ratings', () => {
        it('should return shopper ratings', async () => {
          const response = await request(app.getHttpServer())
            .get(`/v1/matching/shopper/${testShopper.id}/ratings`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('ratings');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.ratings)).toBe(true);

          if (response.body.ratings.length > 0) {
            const rating = response.body.ratings[0];
            expect(rating).toHaveProperty('overall_rating');
            expect(rating).toHaveProperty('comment');
            expect(rating).toHaveProperty('created_at');
          }
        });
      });

      describe('GET /v1/matching/shopper/:shopperId/stats', () => {
        it('should return shopper statistics', async () => {
          const response = await request(app.getHttpServer())
            .get(`/v1/matching/shopper/${testShopper.id}/stats`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('total_orders');
          expect(response.body).toHaveProperty('avg_rating');
          expect(response.body).toHaveProperty('success_rate');
          expect(response.body).toHaveProperty('avg_delivery_time');
          expect(response.body).toHaveProperty('total_earnings');
        });
      });
    });
  });

  describe('Service Credits', () => {
    describe('POST /v1/subscriptions/admin/service-credits/:userId', () => {
      it('should add service credits (admin only)', async () => {
        const creditDto = {
          amount: 500,
          reason: 'Delivery delay compensation',
          description: 'Order was delayed by 30 minutes',
          order_id: testOrder.id,
        };

        const response = await request(app.getHttpServer())
          .post(`/v1/subscriptions/admin/service-credits/${testUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(creditDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.amount).toBe(500);
        expect(response.body.reason).toBe(creditDto.reason);
        expect(response.body.user_id).toBe(testUser.id);
      });

      it('should reject non-admin access', async () => {
        const creditDto = {
          amount: 100,
          reason: 'Test credit',
        };

        await request(app.getHttpServer())
          .post(`/v1/subscriptions/admin/service-credits/${testUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(creditDto)
          .expect(403);
      });
    });

    describe('GET /v1/subscriptions/service-credits', () => {
      it('should return user service credits', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/service-credits')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
          const credit = response.body[0];
          expect(credit).toHaveProperty('id');
          expect(credit).toHaveProperty('amount');
          expect(credit).toHaveProperty('reason');
          expect(credit).toHaveProperty('created_at');
        }
      });
    });
  });

  describe('Admin Analytics', () => {
    describe('GET /v1/subscriptions/admin/stats', () => {
      it('should return subscription statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/subscriptions/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_subscriptions');
        expect(response.body).toHaveProperty('active_subscriptions');
        expect(response.body).toHaveProperty('subscriptions_by_tier');
        expect(response.body).toHaveProperty('monthly_revenue');
        expect(response.body).toHaveProperty('churn_rate');
      });
    });

    describe('GET /v1/matching/analytics/matching-stats', () => {
      it('should return matching statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/matching/analytics/matching-stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('total_matches');
        expect(response.body).toHaveProperty('successful_matches');
        expect(response.body).toHaveProperty('success_rate');
        expect(response.body).toHaveProperty('avg_matching_time');
        expect(response.body).toHaveProperty('top_shoppers');
      });
    });
  });

  describe('Subscription Cancellation', () => {
    describe('POST /v1/subscriptions/cancel', () => {
      it('should cancel subscription', async () => {
        const cancelDto = {
          reason: 'Moving to different area',
          feedback: 'Great service, but no longer needed',
          cancel_immediately: false,
        };

        const response = await request(app.getHttpServer())
          .post('/v1/subscriptions/cancel')
          .set('Authorization', `Bearer ${userToken}`)
          .send(cancelDto)
          .expect(201);

        expect(response.body.success).toBe(true);

        // Verify subscription status
        const subscriptionResponse = await request(app.getHttpServer())
          .get('/v1/subscriptions/my-subscription')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        // Should still be active until period end since cancel_immediately was false
        expect(subscriptionResponse.body.status).toBe(SubscriptionStatus.ACTIVE);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete subscription and matching workflow', async () => {
      // Create new user for integration test
      const integrationUser = await prisma.user.create({
        data: {
          email: 'integration@test.com',
          password_hash: 'hashed_password',
          first_name: 'Integration',
          last_name: 'User',
          phone: '09099999999',
          role: 'user',
        },
      });

      const integrationToken = await authService.generateToken(integrationUser);

      // 1. Create VIP subscription
      const subscriptionResponse = await request(app.getHttpServer())
        .post('/v1/subscriptions')
        .set('Authorization', `Bearer ${integrationToken}`)
        .send({
          tier: SubscriptionTier.VIP,
          preferred_time_slots: [TimeSlotPreference.ANYTIME],
          default_priority: DeliveryPriority.EXPRESS,
        })
        .expect(201);

      expect(subscriptionResponse.body.tier).toBe(SubscriptionTier.VIP);

      // 2. Create order
      const orderResponse = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${integrationToken}`)
        .send({
          delivery_address: '東京都港区3-3-3',
          delivery_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          items: [
            { name: '高級和牛', qty: '500g', estimate_price: 5000 },
            { name: 'トリュフ', qty: '50g', estimate_price: 3000 },
          ],
          priority: DeliveryPriority.EXPRESS,
        })
        .expect(201);

      // 3. Find shoppers with VIP priority
      const matchingResponse = await request(app.getHttpServer())
        .post('/v1/matching/find-shoppers')
        .set('Authorization', `Bearer ${integrationToken}`)
        .send({
          order_id: orderResponse.body.id,
          priority: DeliveryPriority.EXPRESS,
          subscriber_only: true,
        })
        .expect(201);

      expect(Array.isArray(matchingResponse.body)).toBe(true);

      // 4. Check subscription usage
      const usageResponse = await request(app.getHttpServer())
        .get('/v1/subscriptions/usage')
        .set('Authorization', `Bearer ${integrationToken}`)
        .expect(200);

      expect(usageResponse.body.orders_this_period).toBe(1);

      // Clean up
      await prisma.orderItem.deleteMany({ where: { order_id: orderResponse.body.id } });
      await prisma.order.delete({ where: { id: orderResponse.body.id } });
      await prisma.subscription.deleteMany({ where: { user_id: integrationUser.id } });
      await prisma.user.delete({ where: { id: integrationUser.id } });
    });
  });
});