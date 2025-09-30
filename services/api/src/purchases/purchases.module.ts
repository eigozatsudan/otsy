import { Module } from '@nestjs/common';
import { PurchasesController, PurchaseController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController, PurchaseController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}