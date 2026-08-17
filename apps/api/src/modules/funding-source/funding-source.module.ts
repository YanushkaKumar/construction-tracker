import { Module } from '@nestjs/common';
import { FundingSourceController } from './funding-source.controller';
import { FundingSourceService } from './funding-source.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FundingSourceController],
  providers: [FundingSourceService],
  exports: [FundingSourceService],
})
export class FundingSourceModule {}
