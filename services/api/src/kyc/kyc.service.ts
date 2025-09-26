import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { 
  KycDocumentKind, 
  KycStatus, 
  RiskTier, 
  StartKycSessionDto, 
  GetUploadUrlDto, 
  SubmitKycDto, 
  ReviewKycDto,
  KycResultDto 
} from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async startKycSession(shopperId: string): Promise<{ session_id: string }> {
    // Check if shopper exists
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    // Check if KYC is already approved
    if (shopper.kyc_status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }

    // For now, we'll use the shopper ID as session ID
    // In a real implementation, you might create a separate KYC session entity
    return { session_id: shopperId };
  }

  async generateUploadUrl(
    shopperId: string, 
    getUploadUrlDto: GetUploadUrlDto
  ): Promise<{ upload_url: string; file_url: string }> {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    if (shopper.kyc_status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }

    const folder = `kyc/${shopperId}`;
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(folder);

    return {
      upload_url: uploadUrl,
      file_url: fileUrl,
    };
  }

  async submitKyc(shopperId: string, submitKycDto: SubmitKycDto): Promise<void> {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    if (shopper.kyc_status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }

    // Validate required documents
    const requiredDocuments = [
      KycDocumentKind.ID_FRONT,
      KycDocumentKind.ID_BACK,
      KycDocumentKind.SELFIE,
    ];

    const submittedKinds = submitKycDto.documents.map(doc => doc.kind);
    const missingDocuments = requiredDocuments.filter(kind => !submittedKinds.includes(kind));

    if (missingDocuments.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missingDocuments.join(', ')}`);
    }

    // Delete existing KYC documents for this shopper
    await this.prisma.kycDocument.deleteMany({
      where: { shopper_id: shopperId },
    });

    // Create new KYC documents
    const kycDocuments = submitKycDto.documents.map(doc => ({
      shopper_id: shopperId,
      type: doc.kind === KycDocumentKind.ID_FRONT || doc.kind === KycDocumentKind.ID_BACK ? 'identity' : 'address',
      kind: doc.kind,
      file_url: doc.image_url,
      image_url: doc.image_url,
      status: KycStatus.PENDING,
    }));

    await this.prisma.kycDocument.createMany({
      data: kycDocuments,
    });

    // Update shopper KYC status
    await this.prisma.shopper.update({
      where: { id: shopperId },
      data: {
        kyc_status: KycStatus.PENDING,
      },
    });

    // Create audit log
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: '00000000-0000-0000-0000-000000000000', // Placeholder for KYC actions
        actor_id: shopperId,
        actor_role: 'shopper',
        action: 'kyc_submitted',
        payload: {
          documents: submitKycDto.documents.map(doc => ({ kind: doc.kind })),
        },
      },
    });
  }

  async getKycResult(shopperId: string): Promise<KycResultDto> {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
      include: {
        kyc_documents: {
          orderBy: { uploaded_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    return {
      status: shopper.kyc_status as KycStatus,
      risk_tier: shopper.risk_tier as RiskTier,
      submitted_at: shopper.kyc_documents[0]?.uploaded_at,
    };
  }

  async reviewKyc(
    adminId: string, 
    shopperId: string, 
    reviewKycDto: ReviewKycDto
  ): Promise<void> {
    const shopper = await this.prisma.shopper.findUnique({
      where: { id: shopperId },
    });

    if (!shopper) {
      throw new NotFoundException('Shopper not found');
    }

    if (shopper.kyc_status !== KycStatus.PENDING && shopper.kyc_status !== KycStatus.NEEDS_REVIEW) {
      throw new BadRequestException('KYC is not in reviewable state');
    }

    // Update shopper KYC status and risk tier
    await this.prisma.shopper.update({
      where: { id: shopperId },
      data: {
        kyc_status: reviewKycDto.status,
        risk_tier: reviewKycDto.risk_tier,
      },
    });

    // Update KYC documents status
    await this.prisma.kycDocument.updateMany({
      where: { shopper_id: shopperId },
      data: {
        status: reviewKycDto.status,
      },
    });

    // Create audit log
    await this.prisma.orderAuditLog.create({
      data: {
        order_id: '00000000-0000-0000-0000-000000000000', // Placeholder for KYC actions
        actor_id: adminId,
        actor_role: 'admin',
        action: 'kyc_reviewed',
        payload: {
          shopper_id: shopperId,
          status: reviewKycDto.status,
          risk_tier: reviewKycDto.risk_tier,
          notes: reviewKycDto.notes,
        },
      },
    });
  }

  async getKycDocuments(shopperId: string) {
    const documents = await this.prisma.kycDocument.findMany({
      where: { shopper_id: shopperId },
      orderBy: { uploaded_at: 'desc' },
    });

    // Generate signed URLs for viewing documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const key = doc.image_url.split('/').pop(); // Extract key from URL
        const signedUrl = await this.storageService.generateDownloadUrl(`kyc/${shopperId}/${key}`);
        
        return {
          ...doc,
          signed_url: signedUrl,
        };
      })
    );

    return documentsWithUrls;
  }

  async getPendingKycReviews() {
    return this.prisma.shopper.findMany({
      where: {
        kyc_status: {
          in: [KycStatus.PENDING, KycStatus.NEEDS_REVIEW],
        },
      },
      include: {
        kyc_documents: {
          orderBy: { uploaded_at: 'desc' },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  private calculateRiskTier(documents: any[]): RiskTier {
    // Simple risk assessment logic
    // In a real implementation, this would involve ML models or external services
    
    if (documents.length < 3) {
      return RiskTier.L_MINUS_1; // Insufficient documents
    }

    // For demo purposes, assign L1 to most users
    return RiskTier.L1;
  }
}