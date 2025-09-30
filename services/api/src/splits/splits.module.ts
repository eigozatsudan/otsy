import { Module } from '@nestjs/common';
import { SplitsController } from './splits.controller';
import { SplitsService } from './splits.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SplitsController],
  providers: [SplitsService],
  exports: [SplitsService],
})
export class SplitsModule {}