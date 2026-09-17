import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubcontractorService } from './subcontractor.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Subcontractors')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class SubcontractorController {
  constructor(private readonly subcontractorService: SubcontractorService) {}

  // ── Subcontractors ────────────────────────

  @Post('subcontractors')
  @ApiOperation({ summary: 'Register a subcontractor' })
  @RequirePermissions('finance:manage')
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.create(companyId, data);
  }

  @Get('subcontractors')
  @ApiOperation({ summary: 'List all subcontractors' })
  @RequirePermissions('finance:view')
  findAll(@CompanyId() companyId: string) {
    return this.subcontractorService.findAll(companyId);
  }

  @Get('subcontractors/:id')
  @ApiOperation({ summary: 'Get subcontractor with contracts' })
  @RequirePermissions('finance:view')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.subcontractorService.findOne(id, companyId);
  }

  @Patch('subcontractors/:id')
  @ApiOperation({ summary: 'Update a subcontractor' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.update(id, companyId, data);
  }

  @Delete('subcontractors/:id')
  @ApiOperation({ summary: 'Delete a subcontractor' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.subcontractorService.delete(id, companyId);
  }

  // ── Contracts ─────────────────────────────

  @Post('subcontractor-contracts')
  @ApiOperation({ summary: 'Create a subcontractor contract' })
  @RequirePermissions('finance:manage')
  createContract(@CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.createContract(companyId, data);
  }

  @Get('subcontractor-contracts')
  @ApiOperation({ summary: 'List contracts, optionally by project' })
  @RequirePermissions('finance:view')
  getContracts(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.subcontractorService.getContracts(companyId, projectId);
  }

  @Patch('subcontractor-contracts/:id')
  @ApiOperation({ summary: 'Update a contract' })
  @RequirePermissions('finance:manage')
  updateContract(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.updateContract(id, companyId, data);
  }

  // ── Payments ──────────────────────────────

  @Post('subcontractor-contracts/:contractId/payments')
  @ApiOperation({ summary: 'Record a payment to a subcontractor' })
  @RequirePermissions('finance:manage')
  createPayment(@Param('contractId') contractId: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.subcontractorService.createPayment(contractId, companyId, data);
  }

  @Get('subcontractor-contracts/:contractId/payments')
  @ApiOperation({ summary: 'List payments for a contract' })
  @RequirePermissions('finance:view')
  getPayments(@Param('contractId') contractId: string, @CompanyId() companyId: string) {
    return this.subcontractorService.getPayments(contractId, companyId);
  }
}
