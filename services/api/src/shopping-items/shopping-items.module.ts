import { Module } from '@nestjs/common';
import { ShoppingItemsController, ShoppingItemController } from './shopping-items.controller';
import { ShoppingItemsService } from './shopping-items.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShoppingItemsController, ShoppingItemController],
  providers: [ShoppingItemsService],
  exports: [ShoppingItemsService],
})
export class ShoppingItemsModule {}