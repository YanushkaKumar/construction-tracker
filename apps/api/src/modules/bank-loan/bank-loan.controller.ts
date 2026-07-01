import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BankLoanService } from './bank-loan.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Bank Loans')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('bank-loans')
export class BankLoanController {
  constructor(private readonly bankLoanService: BankLoanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank loan' })
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.bankLoanService.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all bank loans for the company' })
  findAll(@CompanyId() companyId: string) {
    return this.bankLoanService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bank loan' })
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.bankLoanService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank loan' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.bankLoanService.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank loan' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.bankLoanService.delete(id, companyId);
  }

  @Post('bank-loans/:id/repayments')
  @ApiOperation({ summary: 'Record a bank loan repayment' })
  createRepayment(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() data: any,
  ) {
    return this.bankLoanService.createRepayment(id, companyId, data);
  }

  @Delete('bank-loans/repayments/:repaymentId')
  @ApiOperation({ summary: 'Delete a bank loan repayment' })
  deleteRepayment(
    @Param('repaymentId') repaymentId: string,
    @CompanyId() companyId: string,
  ) {
    return this.bankLoanService.deleteRepayment(repaymentId, companyId);
  }
}
