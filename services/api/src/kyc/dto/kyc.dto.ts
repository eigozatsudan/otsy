import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum KycDocumentKind {
  ID_FRONT = 'id_front',
  ID_BACK = 'id_back',
  SELFIE = 'selfie',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  NEEDS_REVIEW = 'needs_review',
  REJECTED = 'rejected',
}

export enum RiskTier {
  L0 = 'L0',
  L1 = 'L1',
  L2 = 'L2',
  L_MINUS_1 = 'L-1',
}

export class StartKycSessionDto {
  @IsString()
  shopper_id: string;
}

export class GetUploadUrlDto {
  @IsEnum(KycDocumentKind)
  kind: KycDocumentKind;
}

export class SubmitKycDto {
  @IsString()
  session_id: string;

  documents: {
    kind: KycDocumentKind;
    image_url: string;
  }[];
}

export class ReviewKycDto {
  @IsEnum(KycStatus)
  status: KycStatus;

  @IsOptional()
  @IsEnum(RiskTier)
  risk_tier?: RiskTier;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class KycResultDto {
  status: KycStatus;
  risk_tier?: RiskTier;
  submitted_at?: Date;
  reviewed_at?: Date;
  notes?: string;
}