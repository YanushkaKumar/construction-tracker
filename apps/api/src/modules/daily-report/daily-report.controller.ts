import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DailyReportService } from './daily-report.service';
import { CurrentUser, CompanyId } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Daily Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class DailyReportController {
  constructor(private readonly dailyReportService: DailyReportService) {}

  @Post('projects/:projectId/daily-reports')
  @ApiOperation({ summary: 'Submit daily report' })
  create(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.dailyReportService.create(projectId, user.sub, data);
  }

  @Get('projects/:projectId/daily-reports')
  @ApiOperation({ summary: 'List project daily reports' })
  findByProject(@Param('projectId') projectId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.dailyReportService.findByProject(projectId, page, limit);
  }

  @Get('daily-reports')
  @ApiOperation({ summary: 'List all daily reports for the company' })
  findByCompany(@CompanyId() companyId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.dailyReportService.findByCompany(companyId, page, limit);
  }

  @Get('daily-reports/:id')
  @ApiOperation({ summary: 'Get daily report details' })
  findOne(@Param('id') id: string) {
    return this.dailyReportService.findById(id);
  }
}
