import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { ReceiptProcessorService } from './receipt-processor.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, ReceiptProcessorService],
  exports: [ReceiptsService, ReceiptProcessorService],
})
export class ReceiptsModule {}