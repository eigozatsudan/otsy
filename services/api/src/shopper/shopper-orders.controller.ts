import { 
  Controller, 
  Get, 
  Query, 
  UseGuards 
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
}