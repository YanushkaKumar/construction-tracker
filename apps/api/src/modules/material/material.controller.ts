import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards , Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MaterialService } from './material.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Materials')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('materials')
  @ApiOperation({ summary: 'List materials' })
  @RequirePermissions('materials:view')
  findAll(@CompanyId() companyId: string) { return this.materialService.findAll(companyId); }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  @RequirePermissions('materials:manage')
  create(@CompanyId() companyId: string, @Body() data: any) { return this.materialService.create(companyId, data); }

  @Post('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'Create material request' })
  @RequirePermissions('materials:manage')
  createRequest(@Param('projectId') projectId: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.materialService.createRequest(projectId, companyId, user.sub, data);
  }

  @Get('material-requests')
  @ApiOperation({ summary: 'List all company material requests' })
  @RequirePermissions('materials:view')
  findAllRequests(@CompanyId() companyId: string, @Query('status') status?: string) {
    return this.materialService.findRequestsByCompany(companyId, status);
  }

  @Get('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'List project material requests' })
  @RequirePermissions('materials:view')
  findRequests(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.materialService.findRequestsByProject(projectId, companyId);
  }

  @Patch('material-requests/:id/status')
  @ApiOperation({ summary: 'Update request status' })
  @RequirePermissions('materials:manage')
  updateRequestStatus(@Param('id') id: string, @CompanyId() companyId: string, @Body('status') status: string) {
    return this.materialService.updateRequestStatus(id, companyId, status);
  }

  @Patch('materials/:id')
  @ApiOperation({ summary: 'Update a material' })
  @RequirePermissions('materials:manage')
  updateMaterial(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.materialService.updateMaterial(id, companyId, data);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete a material' })
  @RequirePermissions('materials:manage')
  deleteMaterial(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.materialService.deleteMaterial(id, companyId);
  }

  @Delete('material-requests/:id')
  @ApiOperation({ summary: 'Delete a material request' })
  @RequirePermissions('materials:manage')
  deleteRequest(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.materialService.deleteRequest(id, companyId);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update a supplier' })
  @RequirePermissions('materials:manage')
  updateSupplier(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.materialService.updateSupplier(id, companyId, data);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete or deactivate a supplier' })
  @RequirePermissions('materials:manage')
  deleteSupplier(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.materialService.deleteSupplier(id, companyId);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers' })
  @RequirePermissions('materials:view')
  findSuppliers(@CompanyId() companyId: string) { return this.materialService.findSuppliers(companyId); }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  @RequirePermissions('materials:manage')
  createSupplier(@CompanyId() companyId: string, @Body() data: any) { return this.materialService.createSupplier(companyId, data); }
}
