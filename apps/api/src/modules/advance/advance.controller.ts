import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdvanceService } from './advance.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Advances')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class AdvanceController {
  constructor(private readonly advanceService: AdvanceService) {}

  @Post('projects/:projectId/advances')
  @ApiOperation({ summary: 'Record advance received from a project' })
  @RequirePermissions('finance:manage')
  create(
    @Param('projectId') projectId: string,
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.advanceService.create(projectId, companyId, user.sub, data);
  }

  @Get('projects/:projectId/advances')
  @ApiOperation({ summary: 'List advances for a project' })
  @RequirePermissions('finance:view')
  findByProject(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.advanceService.findByProject(projectId, companyId);
  }

  @Get('advances')
  @ApiOperation({ summary: 'List all advances across company' })
  @RequirePermissions('finance:view')
  findAll(
    @CompanyId() companyId: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.advanceService.findAll(companyId, { projectId, startDate, endDate });
  }

  @Get('advances/summary')
  @ApiOperation({ summary: 'Get aggregated advance summary per project' })
  @RequirePermissions('finance:view')
  getSummary(@CompanyId() companyId: string) {
    return this.advanceService.getSummary(companyId);
  }

  @Patch('advances/:id')
  @ApiOperation({ summary: 'Update an advance record' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.advanceService.update(id, companyId, data);
  }

  @Delete('advances/:id')
  @ApiOperation({ summary: 'Delete an advance record' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.advanceService.delete(id, companyId);
  }
}
