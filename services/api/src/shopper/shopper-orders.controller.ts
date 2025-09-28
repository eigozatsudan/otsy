import { 
  Controller, 
  Get, 
  Post,
  Query, 
  UseGuards,
  Param,
  Body
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderFilterDto } from '../orders/dto/order.dto';

@Controller('shopper/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('shopper')
export class ShopperOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('available')
  async getAvailableOrders(@CurrentUser() shopper: any, @Query() filterDto: OrderFilterDto) {
    return this.ordersService.getAvailableOrders(shopper.id, filterDto);
  }

  @Get('my-orders')
  async getMyOrders(@CurrentUser() shopper: any, @Query() filterDto: OrderFilterDto) {
    const customFilter = { ...filterDto, shopper_id: shopper.id };
    return this.ordersService.findMany(customFilter);
  }

  @Get('history')
  async getOrderHistory(@CurrentUser() shopper: any, @Query() filterDto: OrderFilterDto) {
    const customFilter = { ...filterDto, shopper_id: shopper.id };
    return this.ordersService.findMany(customFilter);
  }

  @Get(':id')
  async getOrder(@CurrentUser() shopper: any, @Param('id') orderId: string) {
    return this.ordersService.findOne(orderId);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @CurrentUser() shopper: any, 
    @Param('id') orderId: string,
    @Body() body: { reason?: string }
  ) {
    return this.ordersService.cancelOrderByShopper(shopper.id, orderId, body.reason);
  }
}