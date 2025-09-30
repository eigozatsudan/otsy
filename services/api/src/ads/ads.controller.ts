import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { PrivacyJwtAuthGuard } from '../auth/guards/privacy-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateAdCreativeDto,
  UpdateAdCreativeDto,
  LogAdImpressionDto,
  AdCreativeResponseDto,
  AdDisplayResponseDto,
  AdStatsResponseDto,
  ReportAdDto,
  AdSlot
} from './dto/ad.dto';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('display/:slot')
  @ApiOperation({ 
    summary: 'Get an ad to display for a specific slot',
    description: 'Returns an appropriate ad for the specified slot with frequency control. Authentication is optional.'
  })
  @ApiQuery({ name: 'group_id', required: false, description: 'Group ID for context-aware ads' })
  @ApiResponse({ status: 200, description: 'Ad retrieved successfully', type: AdDisplayResponseDto })
  @ApiResponse({ status: 204, description: 'No ad available for this slot' })
  async getAdForSlot(
    @Param('slot') slot: AdSlot,
    @Query('group_id') groupId?: string,
    @Request() req?: any
  ): Promise<AdDisplayResponseDto | null> {
    // Extract user ID from token if present (optional authentication)
    let userId: string | undefined;
    try {
      if (req?.headers?.authorization) {
        // This would require implementing optional JWT validation
        // For now, we'll skip user-specific frequency control for unauthenticated requests
      }
    } catch (error) {
      // Ignore authentication errors for this endpoint
    }

    return this.adsService.getAdForSlot(slot, userId, groupId);
  }

  @Post('impression')
  @ApiOperation({ 
    summary: 'Log an ad impression',
    description: 'Records that an ad was shown to a user. Authentication is optional for privacy.'
  })
  @ApiResponse({ status: 201, description: 'Impression logged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ad creative or data' })
  async logImpression(
    @Body() logImpressionDto: LogAdImpressionDto,
    @Request() req?: any
  ): Promise<{ success: boolean }> {
    // Extract user ID from token if present (optional)
    let userId: string | undefined;
    try {
      if (req?.headers?.authorization) {
        // Optional user tracking for frequency control
      }
    } catch (error) {
      // Ignore authentication errors
    }

    await this.adsService.logImpression(logImpressionDto, userId);
    return { success: true };
  }

  @Post('report')
  @UseGuards(PrivacyJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report inappropriate ad content' })
  @ApiResponse({ status: 201, description: 'Ad report submitted successfully' })
  @ApiResponse({ status: 404, description: 'Ad creative not found' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async reportAd(
    @Request() req: any,
    @Body() reportAdDto: ReportAdDto
  ): Promise<{ message: string }> {
    return this.adsService.reportAd(reportAdDto, req.user.id);
  }

  // Admin endpoints
  @Post('creatives')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ad creative (admin only)' })
  @ApiResponse({ status: 201, description: 'Ad creative created successfully', type: AdCreativeResponseDto })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async createAdCreative(
    @Body() createAdDto: CreateAdCreativeDto
  ): Promise<AdCreativeResponseDto> {
    return this.adsService.createAdCreative(createAdDto);
  }

  @Get('creatives')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ad creatives (admin only)' })
  @ApiResponse({ status: 200, description: 'Ad creatives retrieved successfully', type: [AdCreativeResponseDto] })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAllAdCreatives(): Promise<AdCreativeResponseDto[]> {
    return this.adsService.getAllAdCreatives();
  }

  @Get('creatives/:id')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ad creative by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Ad creative retrieved successfully', type: AdCreativeResponseDto })
  @ApiResponse({ status: 404, description: 'Ad creative not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAdCreativeById(@Param('id') id: string): Promise<AdCreativeResponseDto> {
    return this.adsService.getAdCreativeById(id);
  }

  @Put('creatives/:id')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ad creative (admin only)' })
  @ApiResponse({ status: 200, description: 'Ad creative updated successfully', type: AdCreativeResponseDto })
  @ApiResponse({ status: 404, description: 'Ad creative not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async updateAdCreative(
    @Param('id') id: string,
    @Body() updateAdDto: UpdateAdCreativeDto
  ): Promise<AdCreativeResponseDto> {
    return this.adsService.updateAdCreative(id, updateAdDto);
  }

  @Delete('creatives/:id')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ad creative (admin only)' })
  @ApiResponse({ status: 200, description: 'Ad creative deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ad creative not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async deleteAdCreative(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adsService.deleteAdCreative(id);
    return { success: true };
  }

  @Get('stats')
  @UseGuards(PrivacyJwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get advertising statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Ad statistics retrieved successfully', type: AdStatsResponseDto })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAdStats(): Promise<AdStatsResponseDto> {
    return this.adsService.getAdStats();
  }
}