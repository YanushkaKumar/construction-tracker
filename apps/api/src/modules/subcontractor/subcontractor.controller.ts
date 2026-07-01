import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubcontractorService } from './subcontractor.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Subcontractors')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class SubcontractorController {
  constructor(private readonly subcontractorService: SubcontractorService) {}

  // ── Subcontractors ────────────────────────

  @Post('subcontractors')
  @ApiOperation({ summary: 'Register a subcontractor' })
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.create(companyId, data);
  }

  @Get('subcontractors')
  @ApiOperation({ summary: 'List all subcontractors' })
  findAll(@CompanyId() companyId: string) {
    return this.subcontractorService.findAll(companyId);
  }

  @Get('subcontractors/:id')
  @ApiOperation({ summary: 'Get subcontractor with contracts' })
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.subcontractorService.findOne(id, companyId);
  }

  @Patch('subcontractors/:id')
  @ApiOperation({ summary: 'Update a subcontractor' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.update(id, companyId, data);
  }

  @Delete('subcontractors/:id')
  @ApiOperation({ summary: 'Delete a subcontractor' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.subcontractorService.delete(id, companyId);
  }

  // ── Contracts ─────────────────────────────

  @Post('subcontractor-contracts')
  @ApiOperation({ summary: 'Create a subcontractor contract' })
  createContract(@CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.createContract(companyId, data);
  }

  @Get('subcontractor-contracts')
  @ApiOperation({ summary: 'List contracts, optionally by project' })
  getContracts(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.subcontractorService.getContracts(companyId, projectId);
  }

  @Patch('subcontractor-contracts/:id')
  @ApiOperation({ summary: 'Update a contract' })
  updateContract(@Param('id') id: string, @Body() data: any) {
    return this.subcontractorService.updateContract(id, data);
  }

  // ── Payments ──────────────────────────────

  @Post('subcontractor-contracts/:contractId/payments')
  @ApiOperation({ summary: 'Record a payment to a subcontractor' })
  createPayment(@Param('contractId') contractId: string, @Body() data: any) {
    return this.subcontractorService.createPayment(contractId, data);
  }

  @Get('subcontractor-contracts/:contractId/payments')
  @ApiOperation({ summary: 'List payments for a contract' })
  getPayments(@Param('contractId') contractId: string) {
    return this.subcontractorService.getPayments(contractId);
  }
}
