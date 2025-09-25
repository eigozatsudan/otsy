import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Patch 
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  StartKycSessionDto, 
  GetUploadUrlDto, 
  SubmitKycDto, 
  ReviewKycDto 
} from './dto/kyc.dto';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Post('sessions')
  async startSession(@CurrentUser() user: any) {
    return this.kycService.startKycSession(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Post('upload')
  async getUploadUrl(
    @CurrentUser() user: any,
    @Query() getUploadUrlDto: GetUploadUrlDto
  ) {
    return this.kycService.generateUploadUrl(user.id, getUploadUrlDto);
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Post('submit')
  async submitKyc(
    @CurrentUser() user: any,
    @Body() submitKycDto: SubmitKycDto
  ) {
    await this.kycService.submitKyc(user.id, submitKycDto);
    return { message: 'KYC submitted successfully' };
  }

  @UseGuards(RolesGuard)
  @Roles('shopper')
  @Get('result')
  async getResult(@CurrentUser() user: any) {
    return this.kycService.getKycResult(user.id);
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('pending')
  async getPendingReviews() {
    return this.kycService.getPendingKycReviews();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('documents/:shopperId')
  async getDocuments(@Param('shopperId') shopperId: string) {
    return this.kycService.getKycDocuments(shopperId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('review/:shopperId')
  async reviewKyc(
    @CurrentUser() admin: any,
    @Param('shopperId') shopperId: string,
    @Body() reviewKycDto: ReviewKycDto
  ) {
    await this.kycService.reviewKyc(admin.id, shopperId, reviewKycDto);
    return { message: 'KYC review completed' };
  }
}