import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MaterialService } from './material.service';
import { CompanyId, CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Materials')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('materials')
  @ApiOperation({ summary: 'List materials' })
  findAll(@CompanyId() companyId: string) { return this.materialService.findAll(companyId); }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  create(@CompanyId() companyId: string, @Body() data: any) { return this.materialService.create(companyId, data); }

  @Post('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'Create material request' })
  createRequest(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.materialService.createRequest(projectId, user.sub, data);
  }

  @Get('material-requests')
  @ApiOperation({ summary: 'List all company material requests' })
  findAllRequests(@CompanyId() companyId: string, @Query('status') status?: string) {
    return this.materialService.findRequestsByCompany(companyId, status);
  }

  @Get('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'List project material requests' })
  findRequests(@Param('projectId') projectId: string) { return this.materialService.findRequestsByProject(projectId); }

  @Patch('material-requests/:id/status')
  @ApiOperation({ summary: 'Update request status' })
  updateRequestStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.materialService.updateRequestStatus(id, status);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers' })
  findSuppliers(@CompanyId() companyId: string) { return this.materialService.findSuppliers(companyId); }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  createSupplier(@CompanyId() companyId: string, @Body() data: any) { return this.materialService.createSupplier(companyId, data); }
}
