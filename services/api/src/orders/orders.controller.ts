import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Patch, 
  UseGuards,
  Delete,
  ForbiddenException
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  CreateOrderDto, 
  UpdateOrderStatusDto, 
  AcceptOrderDto, 
  OrderApprovalDto, 
  OrderFilterDto 
} from './dto/order.dto';
import { CreateOrderFromLlmDto, VoiceToOrderDto } from './dto/llm-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // User endpoints
  @UseGuards(RolesGuard)
  @Roles('user')
  @Post()
  async create(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('from-llm')
  async createFromLlm(@CurrentUser() user: any, @Body() createFromLlmDto: CreateOrderFromLlmDto) {
    return this.ordersService.createOrderFromLlm(user.id, createFromLlmDto);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('from-voice')
  async createFromVoice(@CurrentUser() user: any, @Body() voiceToOrderDto: VoiceToOrderDto) {
    return this.ordersService.createOrderFromVoice(user.id, voiceToOrderDto);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('preview-shopping-list')
  async previewShoppingList(
    @CurrentUser() user: any,
    @Body() body: {
      input: string;
      existing_items?: string[];
      dietary_restrictions?: string[];
      budget_level?: number;
    }
  ) {
    return this.ordersService.generateShoppingListPreview(user.id, body.input, {
      existing_items: body.existing_items,
      dietary_restrictions: body.dietary_restrictions,
      budget_level: body.budget_level,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('from-llm-session')
  async createFromLlmSession(
    @CurrentUser() user: any,
    @Body() body: {
      session_id: string;
      mode: 'approve' | 'delegate';
      receipt_check: 'required' | 'auto';
      address_json: any;
      deadline_ts?: string;
      priority?: number;
    }
  ) {
    return this.ordersService.createFromLlmSession(user.id, body.session_id, {
      mode: body.mode as any,
      receipt_check: body.receipt_check as any,
      address_json: body.address_json,
      deadline_ts: body.deadline_ts,
      priority: body.priority,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: any, @Query() filterDto: OrderFilterDto) {
    return this.ordersService.getOrderHistory(user.id, filterDto);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post(':id/approve')
  async approveReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() approvalDto: OrderApprovalDto
  ) {
    return this.ordersService.approveReceipt(user.id, id, approvalDto);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Delete(':id')
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    return this.ordersService.cancelOrder(user.id, id, body.reason);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post(':id/authorize-payment')
  async authorizeOrderPayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { payment_method_id?: string }
  ) {
    // This would integrate with PaymentsService
    // For now, return a placeholder
    return { 
      message: 'Payment authorization endpoint - integrate with PaymentsService',
      order_id: id,
      payment_method_id: body.payment_method_id 
    };
  }

  // Shopper endpoints have been removed in the pivot

  // Shared endpoints (user can view their orders, shopper can view accepted orders)
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    
    // Check permissions
    const isOwner = order.user_id === user.id;
    // Shopper functionality removed
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to view this order');
    }
    
    return order;
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(@Query() filterDto: OrderFilterDto) {
    return this.ordersService.findMany(filterDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/admin-status')
  async adminUpdateStatus(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(admin.id, 'admin', id, updateStatusDto);
  }
}