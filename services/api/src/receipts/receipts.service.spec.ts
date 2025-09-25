import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReceiptProcessorService } from './receipt-processor.service';
import { ReceiptStatus } from './dto/receipt.dto';
import { OrderStatus } from '../orders/dto/order.dto';

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let prismaService: PrismaService;
  let storageService: StorageService;
  let receiptProcessor: ReceiptProcessorService;

  const mockOrder = {
    id: 'order-1',
    user_id: 'user-1',
    shopper_id: 'shopper-1',
    status: OrderStatus.SHOPPING,
    receipt_check: 'required',
    items: [
      { id: 'item-1', name: '牛乳', qty: '1L', price_min: 200, price_max: 300 },
      { id: 'item-2', name: '食パン', qty: '1斤', price_min: 150, price_max: 250 },
    ],
  };

  const mockReceipt = {
    id: 'receipt-1',
    order_id: 'order-1',
    shopper_id: 'shopper-1',
    image_url: 'https://example.com/receipt.jpg',
    submitted_at: new Date(),
    order: mockOrder,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            receipt: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            orderAuditLog: {
              create: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateUploadUrl: jest.fn(),
            generateDownloadUrl: jest.fn(),
          },
        },
        {
          provide: ReceiptProcessorService,
          useValue: {
            processReceiptImage: jest.fn(),
            validateReceiptAgainstOrder: jest.fn(),
            generateReceiptSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
    receiptProcessor = module.get<ReceiptProcessorService>(ReceiptProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUploadUrl', () => {
    it('should generate upload URL for valid order and shopper', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(storageService, 'generateUploadUrl').mockResolvedValue({
        uploadUrl: 'https://example.com/upload',
        fileUrl: 'https://example.com/file',
        key: 'receipts/order-1/receipt.jpg',
      });

      const result = await service.generateUploadUrl('shopper-1', {
        order_id: 'order-1',
        file_extension: 'jpg',
      });

      expect(result).toEqual({
        upload_url: 'https://example.com/upload',
        file_url: 'https://example.com/file',
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        service.generateUploadUrl('shopper-1', {
          order_id: 'non-existent',
          file_extension: 'jpg',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized shopper', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      await expect(
        service.generateUploadUrl('other-shopper', {
          order_id: 'order-1',
          file_extension: 'jpg',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid order status', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(deliveredOrder as any);

      await expect(
        service.generateUploadUrl('shopper-1', {
          order_id: 'order-1',
          file_extension: 'jpg',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitReceipt', () => {
    const submitReceiptDto = {
      order_id: 'order-1',
      image_url: 'https://example.com/receipt.jpg',
      total_amount: 500,
      store_name: 'Test Store',
    };

    it('should submit receipt successfully', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue({
        ...mockOrder,
        user: { id: 'user-1', email: 'user@example.com' },
      } as any);

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          receipt: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            create: jest.fn().mockResolvedValue(mockReceipt),
          },
          order: {
            update: jest.fn().mockResolvedValue(mockOrder),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockReceipt as any);

      const result = await service.submitReceipt('shopper-1', submitReceiptDto);

      expect(result).toEqual(mockReceipt);
    });

    it('should throw ForbiddenException for unauthorized shopper', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      await expect(
        service.submitReceipt('other-shopper', submitReceiptDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid order status', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(deliveredOrder as any);

      await expect(
        service.submitReceipt('shopper-1', submitReceiptDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reviewReceipt', () => {
    const reviewDto = {
      status: ReceiptStatus.APPROVED,
      review_notes: 'Looks good',
    };

    it('should approve receipt successfully', async () => {
      const receiptWithOrder = {
        ...mockReceipt,
        order: { ...mockOrder, status: OrderStatus.AWAIT_RECEIPT_OK },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(receiptWithOrder as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          receipt: {
            update: jest.fn().mockResolvedValue(mockReceipt),
          },
          order: {
            update: jest.fn().mockResolvedValue(mockOrder),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.reviewReceipt('user-1', 'receipt-1', reviewDto);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for non-reviewable receipt', async () => {
      const receiptWithOrder = {
        ...mockReceipt,
        order: { ...mockOrder, status: OrderStatus.DELIVERED },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(receiptWithOrder as any);

      await expect(
        service.reviewReceipt('user-1', 'receipt-1', reviewDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processReceiptImage', () => {
    it('should process receipt image successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockReceipt as any);
      jest.spyOn(receiptProcessor, 'processReceiptImage').mockResolvedValue({
        store_name: 'Test Store',
        total_amount: 500,
        items: [
          { name: '牛乳', qty: '1L', price: 250 },
          { name: '食パン', qty: '1斤', price: 200 },
        ],
        confidence_score: 0.9,
      });

      jest.spyOn(receiptProcessor, 'validateReceiptAgainstOrder').mockResolvedValue({
        matches: true,
        discrepancies: [],
        confidence_score: 0.9,
      });

      jest.spyOn(receiptProcessor, 'generateReceiptSummary').mockResolvedValue(
        'Test Storeで2点の商品を購入。合計金額：¥500'
      );

      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      const result = await service.processReceiptImage('receipt-1', 'user-1', 'user');

      expect(result.processed_data).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockReceipt as any);

      await expect(
        service.processReceiptImage('receipt-1', 'other-user', 'user')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getReceiptStats', () => {
    it('should return receipt statistics', async () => {
      jest.spyOn(prismaService.receipt, 'count')
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10); // pending

      jest.spyOn(prismaService.orderAuditLog, 'count')
        .mockResolvedValueOnce(80) // approved
        .mockResolvedValueOnce(10); // rejected

      const stats = await service.getReceiptStats();

      expect(stats.total_receipts).toBe(100);
      expect(stats.pending_review).toBe(10);
      expect(stats.approved).toBe(80);
      expect(stats.rejected).toBe(10);
      expect(stats.approval_rate).toBe(80);
    });
  });
});