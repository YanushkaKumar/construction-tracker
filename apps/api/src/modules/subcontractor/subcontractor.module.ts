import { Module } from '@nestjs/common';
import { SubcontractorController } from './subcontractor.controller';
import { SubcontractorService } from './subcontractor.service';

@Module({
  controllers: [SubcontractorController],
  providers: [SubcontractorService],
  exports: [SubcontractorService],
})
export class SubcontractorModule {}
