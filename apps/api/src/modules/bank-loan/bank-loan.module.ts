import { Module } from '@nestjs/common';
import { BankLoanController } from './bank-loan.controller';
import { BankLoanService } from './bank-loan.service';

@Module({
  controllers: [BankLoanController],
  providers: [BankLoanService],
  exports: [BankLoanService],
})
export class BankLoanModule {}
