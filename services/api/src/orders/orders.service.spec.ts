import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderMode, ReceiptCheck } from './dto/order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    phone: '+81-90-1234-5678',
    subscription_tier: 'basic',
  };

  const mockShopper = {
    id: 'shopper-1',
    email: 'shopper@example.com',
    phone: '+81-90-8765-4321',
    kyc_status: 'approved',
    status: 'active',
    rating_avg: 4.5,
  };

  const mockOrder = {
    id: 'order-1',
    user_id: 'user-1',
    shopper_id: null,
    status: OrderStatus.NEW,
    mode: OrderMode.APPROVE,
    receipt_check: ReceiptCheck.REQUIRED,
    estimate_amount: 2000,
    address_json: {
      postal_code: '100-0001',
      prefecture: 'Tokyo',
      city: 'Chiyoda',
      address_line: '1-1-1 Chiyoda',
    },
    items: [
      {
        id: 'item-1',
        name: 'Milk',
        qty: '1L',
        price_min: 200,
        price_max: 300,
        allow_subs: true,
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            shopper: {
              findUnique: jest.fn(),
            },
            order: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            orderItem: {
              createMany: jest.fn(),
            },
            orderAuditLog: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      mode: OrderMode.APPROVE,
      receipt_check: ReceiptCheck.REQUIRED,
      estimate_amount: 2000,
      address_json: {
        postal_code: '100-0001',
        prefecture: 'Tokyo',
        city: 'Chiyoda',
        address_line: '1-1-1 Chiyoda',
      },
      items: [
        {
          name: 'Milk',
          qty: '1L',
          price_min: 200,
          price_max: 300,
          allow_subs: true,
        },
      ],
    };

    it('should create an order successfully', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue(mockOrder),
          },
          orderItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });
      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder as any);

      const result = await service.create('user-1', createOrderDto as any);

      expect(result).toEqual(mockOrder);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.create('non-existent', createOrderDto as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      const result = await service.findOne('order-1');

      expect(result).toEqual(mockOrder);
      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptOrder', () => {
    const acceptOrderDto = {
      note: 'Will complete within 2 hours',
      estimated_completion: '2023-12-01T14:00:00Z',
    };

    it('should allow eligible shopper to accept order', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              shopper_id: 'shopper-1',
              status: OrderStatus.ACCEPTED,
            }),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.acceptOrder('shopper-1', 'order-1', acceptOrderDto);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for ineligible shopper', async () => {
      const ineligibleShopper = {
        ...mockShopper,
        kyc_status: 'pending',
      };

      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(ineligibleShopper as any);

      await expect(
        service.acceptOrder('shopper-1', 'order-1', acceptOrderDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for unavailable order', async () => {
      const acceptedOrder = {
        ...mockOrder,
        status: OrderStatus.ACCEPTED,
        shopper_id: 'other-shopper',
      };

      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(service, 'findOne').mockResolvedValue(acceptedOrder as any);

      await expect(
        service.acceptOrder('shopper-1', 'order-1', acceptOrderDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = {
      status: OrderStatus.SHOPPING,
      note: 'Started shopping',
    };

    it('should allow shopper to update their order status', async () => {
      const acceptedOrder = {
        ...mockOrder,
        status: OrderStatus.ACCEPTED,
        shopper_id: 'shopper-1',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(acceptedOrder as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...acceptedOrder,
              status: OrderStatus.SHOPPING,
            }),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.updateStatus('shopper-1', 'shopper', 'order-1', updateStatusDto);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      const acceptedOrder = {
        ...mockOrder,
        status: OrderStatus.ACCEPTED,
        shopper_id: 'other-shopper',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(acceptedOrder as any);

      await expect(
        service.updateStatus('shopper-1', 'shopper', 'order-1', updateStatusDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const deliveredOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
        shopper_id: 'shopper-1',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(deliveredOrder as any);

      await expect(
        service.updateStatus('shopper-1', 'shopper', 'order-1', {
          status: OrderStatus.SHOPPING,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableOrders', () => {
    it('should return available orders for eligible shopper', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(prismaService.order, 'findMany').mockResolvedValue([mockOrder] as any);
      jest.spyOn(prismaService.order, 'count').mockResolvedValue(1);

      const result = await service.getAvailableOrders('shopper-1');

      expect(result.orders).toEqual([mockOrder]);
      expect(result.pagination.total).toBe(1);
    });

    it('should return empty array for ineligible shopper', async () => {
      const ineligibleShopper = {
        ...mockShopper,
        status: 'suspended',
      };

      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(ineligibleShopper as any);

      const result = await service.getAvailableOrders('shopper-1');

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});