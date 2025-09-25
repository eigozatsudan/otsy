import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KycService } from './kyc.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { KycStatus, KycDocumentKind, RiskTier } from './dto/kyc.dto';

describe('KycService', () => {
  let service: KycService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  const mockShopper = {
    id: 'shopper-1',
    email: 'shopper@example.com',
    kyc_status: 'pending',
    risk_tier: null,
    status: 'active',
  };

  const mockApprovedShopper = {
    ...mockShopper,
    kyc_status: 'approved',
    risk_tier: 'L1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: PrismaService,
          useValue: {
            shopper: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            kycDocument: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            orderAuditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateUploadUrl: jest.fn(),
            generateDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startKycSession', () => {
    it('should start KYC session for valid shopper', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);

      const result = await service.startKycSession('shopper-1');

      expect(result).toEqual({ session_id: 'shopper-1' });
    });

    it('should throw NotFoundException for non-existent shopper', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(null);

      await expect(service.startKycSession('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already approved KYC', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockApprovedShopper as any);

      await expect(service.startKycSession('shopper-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateUploadUrl', () => {
    it('should generate upload URL for valid shopper', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(storageService, 'generateUploadUrl').mockResolvedValue({
        uploadUrl: 'https://example.com/upload',
        fileUrl: 'https://example.com/file',
        key: 'kyc/shopper-1/document.jpg',
      });

      const result = await service.generateUploadUrl('shopper-1', {
        kind: KycDocumentKind.ID_FRONT,
      });

      expect(result).toEqual({
        upload_url: 'https://example.com/upload',
        file_url: 'https://example.com/file',
      });
    });

    it('should throw NotFoundException for non-existent shopper', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(null);

      await expect(service.generateUploadUrl('non-existent', {
        kind: KycDocumentKind.ID_FRONT,
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitKyc', () => {
    const validSubmission = {
      session_id: 'shopper-1',
      documents: [
        { kind: KycDocumentKind.ID_FRONT, image_url: 'https://example.com/id-front.jpg' },
        { kind: KycDocumentKind.ID_BACK, image_url: 'https://example.com/id-back.jpg' },
        { kind: KycDocumentKind.SELFIE, image_url: 'https://example.com/selfie.jpg' },
      ],
    };

    it('should submit KYC with all required documents', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(prismaService.kycDocument, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prismaService.kycDocument, 'createMany').mockResolvedValue({ count: 3 });
      jest.spyOn(prismaService.shopper, 'update').mockResolvedValue(mockShopper as any);
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      await service.submitKyc('shopper-1', validSubmission);

      expect(prismaService.kycDocument.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            shopper_id: 'shopper-1',
            kind: KycDocumentKind.ID_FRONT,
            status: KycStatus.PENDING,
          }),
        ]),
      });
    });

    it('should throw BadRequestException for missing documents', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);

      const incompleteSubmission = {
        session_id: 'shopper-1',
        documents: [
          { kind: KycDocumentKind.ID_FRONT, image_url: 'https://example.com/id-front.jpg' },
        ],
      };

      await expect(service.submitKyc('shopper-1', incompleteSubmission)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reviewKyc', () => {
    it('should approve KYC and set risk tier', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockShopper as any);
      jest.spyOn(prismaService.shopper, 'update').mockResolvedValue(mockApprovedShopper as any);
      jest.spyOn(prismaService.kycDocument, 'updateMany').mockResolvedValue({ count: 3 });
      jest.spyOn(prismaService.orderAuditLog, 'create').mockResolvedValue({} as any);

      const reviewDto = {
        status: KycStatus.APPROVED,
        risk_tier: RiskTier.L1,
        notes: 'All documents verified',
      };

      await service.reviewKyc('admin-1', 'shopper-1', reviewDto);

      expect(prismaService.shopper.update).toHaveBeenCalledWith({
        where: { id: 'shopper-1' },
        data: {
          kyc_status: KycStatus.APPROVED,
          risk_tier: RiskTier.L1,
        },
      });
    });

    it('should throw BadRequestException for non-reviewable status', async () => {
      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(mockApprovedShopper as any);

      const reviewDto = {
        status: KycStatus.APPROVED,
        risk_tier: RiskTier.L1,
      };

      await expect(service.reviewKyc('admin-1', 'shopper-1', reviewDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getKycResult', () => {
    it('should return KYC result for shopper', async () => {
      const shopperWithDocuments = {
        ...mockApprovedShopper,
        kyc_documents: [
          {
            uploaded_at: new Date('2023-01-01'),
          },
        ],
      };

      jest.spyOn(prismaService.shopper, 'findUnique').mockResolvedValue(shopperWithDocuments as any);

      const result = await service.getKycResult('shopper-1');

      expect(result).toEqual({
        status: KycStatus.APPROVED,
        risk_tier: RiskTier.L1,
        submitted_at: new Date('2023-01-01'),
      });
    });
  });
});