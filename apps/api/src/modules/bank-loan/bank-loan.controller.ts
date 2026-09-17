import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BankLoanService } from './bank-loan.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Bank Loans')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('bank-loans')
export class BankLoanController {
  constructor(private readonly bankLoanService: BankLoanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank loan' })
  @RequirePermissions('finance:manage')
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.bankLoanService.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all bank loans for the company' })
  @RequirePermissions('finance:view')
  findAll(@CompanyId() companyId: string) {
    return this.bankLoanService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bank loan' })
  @RequirePermissions('finance:view')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.bankLoanService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank loan' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.bankLoanService.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank loan' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.bankLoanService.delete(id, companyId);
  }

  @Post(':id/repayments')
  @ApiOperation({ summary: 'Record a bank loan repayment' })
  @RequirePermissions('finance:manage')
  createRepayment(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() data: any,
  ) {
    return this.bankLoanService.createRepayment(id, companyId, data);
  }

  @Delete('repayments/:repaymentId')
  @ApiOperation({ summary: 'Delete a bank loan repayment' })
  @RequirePermissions('finance:manage')
  deleteRepayment(
    @Param('repaymentId') repaymentId: string,
    @CompanyId() companyId: string,
  ) {
    return this.bankLoanService.deleteRepayment(repaymentId, companyId);
  }
}
