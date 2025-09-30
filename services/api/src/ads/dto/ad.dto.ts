import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsUrl, IsNumber, Min, Max } from 'class-validator';

export enum AdSlot {
    LIST_TOP = 'list_top',
    DETAIL_BOTTOM = 'detail_bottom',
}

export enum AdStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    EXPIRED = 'expired',
}

export class CreateAdCreativeDto {
    @ApiProperty({ description: 'Ad title', example: 'Fresh Organic Vegetables' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Ad description', example: 'Get 20% off on all organic vegetables this week!' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Image URL for the ad', example: 'https://example.com/ad-image.jpg' })
    @IsUrl()
    image_url: string;

    @ApiProperty({ description: 'Click-through URL', example: 'https://example.com/vegetables' })
    @IsUrl()
    click_url: string;

    @ApiProperty({ description: 'Ad slot placement', enum: AdSlot })
    @IsEnum(AdSlot)
    slot: AdSlot;

    @ApiProperty({ description: 'Priority weight (1-10)', example: 5, minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    priority: number;
}

export class UpdateAdCreativeDto {
    @ApiProperty({ description: 'Ad title', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'Ad description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Image URL for the ad', required: false })
    @IsOptional()
    @IsUrl()
    image_url?: string;

    @ApiProperty({ description: 'Click-through URL', required: false })
    @IsOptional()
    @IsUrl()
    click_url?: string;

    @ApiProperty({ description: 'Priority weight (1-10)', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    priority?: number;

    @ApiProperty({ description: 'Ad status', enum: AdStatus, required: false })
    @IsOptional()
    @IsEnum(AdStatus)
    status?: AdStatus;
}

export class LogAdImpressionDto {
    @ApiProperty({ description: 'Ad creative ID' })
    @IsString()
    creative_id: string;

    @ApiProperty({ description: 'Ad slot where impression occurred', enum: AdSlot })
    @IsEnum(AdSlot)
    slot: AdSlot;

    @ApiProperty({ description: 'Group ID (optional for privacy)', required: false })
    @IsOptional()
    @IsUUID()
    group_id?: string;
}

export class AdCreativeResponseDto {
    @ApiProperty({ description: 'Ad creative ID' })
    id: string;

    @ApiProperty({ description: 'Ad title' })
    title: string;

    @ApiProperty({ description: 'Ad description' })
    description: string;

    @ApiProperty({ description: 'Image URL for the ad' })
    image_url: string;

    @ApiProperty({ description: 'Click-through URL' })
    click_url: string;

    @ApiProperty({ description: 'Ad slot placement' })
    slot: AdSlot;

    @ApiProperty({ description: 'Priority weight' })
    priority: number;

    @ApiProperty({ description: 'Ad status' })
    status: AdStatus;

    @ApiProperty({ description: 'Creation date' })
    created_at: Date;

    @ApiProperty({ description: 'Last update date' })
    updated_at: Date;
}

export class AdDisplayResponseDto {
    @ApiProperty({ description: 'Ad creative ID' })
    creative_id: string;

    @ApiProperty({ description: 'Ad title' })
    title: string;

    @ApiProperty({ description: 'Ad description' })
    description: string;

    @ApiProperty({ description: 'Image URL for the ad' })
    image_url: string;

    @ApiProperty({ description: 'Click-through URL' })
    click_url: string;

    @ApiProperty({ description: 'Ad slot placement' })
    slot: AdSlot;
}

export class AdStatsResponseDto {
    @ApiProperty({ description: 'Total impressions' })
    total_impressions: number;

    @ApiProperty({ description: 'Impressions today' })
    impressions_today: number;

    @ApiProperty({ description: 'Impressions this week' })
    impressions_week: number;

    @ApiProperty({ description: 'Impressions this month' })
    impressions_month: number;

    @ApiProperty({ description: 'Active ad creatives count' })
    active_creatives: number;

    @ApiProperty({ description: 'Top performing ads', type: [Object] })
    top_ads: Array<{
        creative_id: string;
        title: string;
        impressions: number;
        slot: string;
    }>;
}

export class ReportAdDto {
    @ApiProperty({ description: 'Ad creative ID being reported' })
    @IsString()
    creative_id: string;

    @ApiProperty({ description: 'Reason for reporting', example: 'Inappropriate content' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Additional details', required: false })
    @IsOptional()
    @IsString()
    details?: string;
}