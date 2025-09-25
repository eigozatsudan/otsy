import { Module } from '@nestjs/common';
import { ShoppersService } from './shoppers.service';
import { ShoppersController } from './shoppers.controller';
import { ShopperOrdersController } from '../shopper/shopper-orders.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [ShoppersController, ShopperOrdersController],
  providers: [ShoppersService],
  exports: [ShoppersService],
})
export class ShoppersModule {}