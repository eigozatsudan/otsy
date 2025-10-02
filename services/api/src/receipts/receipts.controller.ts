import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Delete,
  Patch 
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  SubmitReceiptDto, 
  ReviewReceiptDto, 
  GetReceiptUploadUrlDto 
} from './dto/receipt.dto';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  // Shopper endpoints have been removed in the pivot

  // User endpoints
  @UseGuards(RolesGuard)
  @Roles('user')
  @Get('my-orders')
  async getMyOrderReceipts(@CurrentUser() user: any) {
    return this.receiptsService.getReceiptsByUser(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Patch(':id/review')
  async reviewReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() reviewReceiptDto: ReviewReceiptDto
  ) {
    return this.receiptsService.reviewReceipt(user.id, id, reviewReceiptDto);
  }

  // Shared endpoints (with permission checks)
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const receipt = await this.receiptsService.findOne(id);
    
    // Check permissions
    const canView = 
      user.role === 'admin' ||
      (user.role === 'user' && receipt.order.user_id === user.id);

    if (!canView) {
      throw new Error('Access denied');
    }

    return receipt;
  }

  @Get(':id/view-url')
  async getViewUrl(@CurrentUser() user: any, @Param('id') id: string) {
    const signedUrl = await this.receiptsService.generateSignedViewUrl(
      id, 
      user.id, 
      user.role
    );
    
    return { signed_url: signedUrl };
  }

  @Get('order/:orderId')
  async getReceiptsByOrder(
    @CurrentUser() user: any, 
    @Param('orderId') orderId: string
  ) {
    // Note: Should add permission check for order access
    return this.receiptsService.findByOrderId(orderId);
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async getAllReceipts(@Query() query: { status?: string; page?: number; limit?: number }) {
    if (query.status === 'pending') {
      return this.receiptsService.getPendingReceipts();
    }
    
    // For now, return pending receipts by default
    // In a full implementation, you'd add pagination and filtering
    return this.receiptsService.getPendingReceipts();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('stats/overview')
  async getReceiptStats() {
    return this.receiptsService.getReceiptStats();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/admin-review')
  async adminReviewReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() reviewReceiptDto: ReviewReceiptDto
  ) {
    return this.receiptsService.reviewReceipt(user.id, id, reviewReceiptDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id/admin-delete')
  async adminDeleteReceipt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.receiptsService.deleteReceipt(id, user.id, 'admin');
  }

  // Receipt processing endpoints
  @Post(':id/process')
  async processReceipt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.receiptsService.processReceiptImage(id, user.id, user.role);
  }
}