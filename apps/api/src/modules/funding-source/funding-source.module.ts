import { Module } from '@nestjs/common';
import { FundingSourceController } from './funding-source.controller';
import { FundingSourceService } from './funding-source.service';

@Module({
  controllers: [FundingSourceController],
  providers: [FundingSourceService],
  exports: [FundingSourceService],
})
export class FundingSourceModule {}
