import { Module } from '@nestjs/common';
import { BOQController } from './boq.controller';
import { BOQService } from './boq.service';

@Module({
  controllers: [BOQController],
  providers: [BOQService],
  exports: [BOQService],
})
export class BOQModule {}
