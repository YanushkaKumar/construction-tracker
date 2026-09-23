import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DailyReportService } from './daily-report.service';
import { CurrentUser, CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Daily Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class DailyReportController {
  constructor(private readonly dailyReportService: DailyReportService) {}

  @Post('projects/:projectId/daily-reports')
  @ApiOperation({ summary: 'Submit daily report' })
  @RequirePermissions('daily_reports:submit')
  create(@Param('projectId') projectId: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.dailyReportService.create(projectId, companyId, user.sub, data);
  }

  @Get('projects/:projectId/daily-reports')
  @ApiOperation({ summary: 'List project daily reports' })
  @RequirePermissions('daily_reports:view')
  findByProject(@Param('projectId') projectId: string, @CompanyId() companyId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.dailyReportService.findByProject(projectId, companyId, page, limit);
  }

  @Get('daily-reports')
  @ApiOperation({ summary: 'List all daily reports for the company' })
  @RequirePermissions('daily_reports:view')
  findByCompany(@CompanyId() companyId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.dailyReportService.findByCompany(companyId, page, limit);
  }

  @Patch('daily-reports/:id')
  @ApiOperation({ summary: 'Update a daily report' })
  @RequirePermissions('daily_reports:submit')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.dailyReportService.update(id, companyId, data);
  }

  @Delete('daily-reports/:id')
  @ApiOperation({ summary: 'Delete a daily report' })
  @RequirePermissions('daily_reports:submit')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.dailyReportService.delete(id, companyId);
  }

  @Get('daily-reports/:id')
  @ApiOperation({ summary: 'Get daily report details' })
  @RequirePermissions('daily_reports:view')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.dailyReportService.findById(id, companyId);
  }
}
