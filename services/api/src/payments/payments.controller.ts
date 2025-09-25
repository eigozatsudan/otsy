import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Headers,
  RawBody,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  CreatePaymentIntentDto, 
  AuthorizePaymentDto, 
  CapturePaymentDto, 
  RefundPaymentDto 
} from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // User endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Post('create-intent')
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentIntentDto
  ) {
    return this.paymentsService.createPaymentIntent(user.id, createPaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Post('authorize')
  async authorizePayment(
    @CurrentUser() user: any,
    @Body() authorizePaymentDto: AuthorizePaymentDto
  ) {
    return this.paymentsService.authorizePayment(user.id, authorizePaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Post('capture')
  async capturePayment(
    @CurrentUser() user: any,
    @Body() capturePaymentDto: CapturePaymentDto
  ) {
    return this.paymentsService.capturePayment(user.id, 'user', capturePaymentDto);
  }

  // Shared endpoints (with permission checks)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPayment(@CurrentUser() user: any, @Param('id') id: string) {
    const payment = await this.paymentsService.getPaymentById(id);
    
    // Check permissions
    const canView = 
      user.role === 'admin' ||
      (user.role === 'user' && payment.order.user_id === user.id) ||
      (user.role === 'shopper' && payment.order.shopper_id === user.id);

    if (!canView) {
      throw new Error('Access denied');
    }

    return payment;
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  async getPaymentsByOrder(
    @CurrentUser() user: any, 
    @Param('orderId') orderId: string
  ) {
    // Note: Should add permission check for order access
    return this.paymentsService.getPaymentsByOrder(orderId);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/capture')
  async adminCapturePayment(
    @CurrentUser() user: any,
    @Body() capturePaymentDto: CapturePaymentDto
  ) {
    return this.paymentsService.capturePayment(user.id, 'admin', capturePaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/refund')
  async adminRefundPayment(
    @CurrentUser() user: any,
    @Body() refundPaymentDto: RefundPaymentDto
  ) {
    return this.paymentsService.refundPayment(user.id, 'admin', refundPaymentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('stats/overview')
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  // Webhook endpoint (no authentication required)
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer
  ) {
    return this.paymentsService.handleWebhook(signature, payload);
  }
}