import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from './dto/payment.dto';
import { OrderStatus } from '../orders/dto/order.dto';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      capture: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockOrder = {
    id: 'order-1',
    user_id: 'user-1',
    shopper_id: 'shopper-1',
    status: OrderStatus.NEW,
    estimate_amount: 1000,
    user: { id: 'user-1', email: 'user@example.com' },
    payments: [],
  };

  const mockPayment = {
    id: 'payment-1',
    order_id: 'order-1',
    stripe_pi: 'pi_test_123',
    status: PaymentStatus.PENDING,
    amount: 1000,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            orderAuditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'STRIPE_SECRET_KEY':
                  return 'sk_test_123';
                case 'STRIPE_WEBHOOK_SECRET':
                  return 'whsec_test_123';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    const createPaymentDto = {
      order_id: 'order-1',
      amount: 1000,
      payment_method_id: 'pm_test_123',
    };

    it('should create payment intent successfully', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      // Mock Stripe PaymentIntent creation
      const mockStripe = (service as any).stripe;
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_confirmation',
      });

      const result = await service.createPaymentIntent('user-1', createPaymentDto);

      expect(result.client_secret).toBeDefined();
      expect(result.amount).toBe(1000);
      expect(prismaService.payment.create).toHaveBeenCalledWith({
        data: {
          order_id: 'order-1',
          stripe_pi: 'pi_test_123',
          status: PaymentStatus.PENDING,
          amount: 1000,
        },
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('user-1', createPaymentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      const unauthorizedOrder = { ...mockOrder, user_id: 'other-user' };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(unauthorizedOrder as any);

      await expect(
        service.createPaymentIntent('user-1', createPaymentDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid order status', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(deliveredOrder as any);

      await expect(
        service.createPaymentIntent('user-1', createPaymentDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment already exists', async () => {
      const orderWithPayment = {
        ...mockOrder,
        payments: [{ ...mockPayment, status: PaymentStatus.AUTHORIZED }],
      };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(orderWithPayment as any);

      await expect(
        service.createPaymentIntent('user-1', createPaymentDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('authorizePayment', () => {
    const authorizeDto = {
      order_id: 'order-1',
      payment_method_id: 'pm_test_123',
    };

    it('should authorize payment successfully', async () => {
      const orderWithPayment = {
        ...mockOrder,
        payments: [mockPayment],
      };

      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(orderWithPayment as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.AUTHORIZED,
      } as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      // Mock Stripe PaymentIntent confirmation
      const mockStripe = (service as any).stripe;
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_capture',
      });

      const result = await service.authorizePayment('user-1', authorizeDto);

      expect(result.status).toBe(PaymentStatus.AUTHORIZED);
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { auth_amount: 1000 },
      });
    });

    it('should handle Stripe authorization failure', async () => {
      const orderWithPayment = {
        ...mockOrder,
        payments: [mockPayment],
      };

      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(orderWithPayment as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue(mockPayment as any);

      // Mock Stripe failure
      const mockStripe = (service as any).stripe;
      mockStripe.paymentIntents.confirm.mockRejectedValue(new Error('Card declined'));

      await expect(
        service.authorizePayment('user-1', authorizeDto)
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: PaymentStatus.FAILED },
      });
    });
  });

  describe('capturePayment', () => {
    const captureDto = {
      payment_id: 'payment-1',
      amount: 1000,
      reason: 'Order completed',
    };

    it('should capture payment successfully', async () => {
      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.AUTHORIZED,
        order: {
          ...mockOrder,
          user: { id: 'user-1' },
          shopper: { id: 'shopper-1' },
        },
      };

      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(paymentWithOrder as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.CAPTURED,
      } as any);
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      // Mock Stripe capture
      const mockStripe = (service as any).stripe;
      mockStripe.paymentIntents.capture.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      const result = await service.capturePayment('user-1', 'user', captureDto);

      expect(result.status).toBe(PaymentStatus.CAPTURED);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.AUTHORIZED,
        order: {
          ...mockOrder,
          user: { id: 'other-user' },
          shopper: { id: 'shopper-1' },
        },
      };

      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(paymentWithOrder as any);

      await expect(
        service.capturePayment('user-1', 'user', captureDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for non-authorized payment', async () => {
      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        order: {
          ...mockOrder,
          user: { id: 'user-1' },
        },
      };

      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(paymentWithOrder as any);

      await expect(
        service.capturePayment('user-1', 'user', captureDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundPayment', () => {
    const refundDto = {
      payment_id: 'payment-1',
      amount: 500,
      reason: 'Customer request',
    };

    it('should process refund successfully', async () => {
      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.CAPTURED,
        order: {
          ...mockOrder,
          user: { id: 'user-1' },
        },
      };

      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(paymentWithOrder as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      // Mock Stripe refund
      const mockStripe = (service as any).stripe;
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_test_123',
        amount: 500,
        status: 'succeeded',
      });

      const result = await service.refundPayment('admin-1', 'admin', refundDto);

      expect(result.refund.amount).toBe(500);
      expect(result.refund.id).toBe('re_test_123');
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      const paymentWithOrder = {
        ...mockPayment,
        status: PaymentStatus.CAPTURED,
        order: mockOrder,
      };

      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(paymentWithOrder as any);

      await expect(
        service.refundPayment('user-1', 'user', refundDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      jest.spyOn(prismaService.payment, 'count')
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // authorized
        .mockResolvedValueOnce(70)  // captured
        .mockResolvedValueOnce(5)   // refunded
        .mockResolvedValueOnce(5);  // failed

      jest.spyOn(prismaService.payment, 'aggregate').mockResolvedValue({
        _sum: { amount: 100000 },
      } as any);

      const stats = await service.getPaymentStats();

      expect(stats.total_payments).toBe(100);
      expect(stats.captured).toBe(70);
      expect(stats.total_revenue).toBe(100000);
      expect(stats.success_rate).toBe(70);
    });
  });
});