import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('budget-vs-actual')
  @ApiOperation({ summary: 'Budget vs actual report' })
  @RequirePermissions('reports:financial')
  budgetVsActual(@CompanyId() companyId: string) { return this.reportService.budgetVsActual(companyId); }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense breakdown report' })
  @RequirePermissions('reports:financial')
  expenseBreakdown(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.reportService.expenseBreakdown(companyId, projectId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Progress report' })
  @RequirePermissions('reports:progress')
  progress(@CompanyId() companyId: string) { return this.reportService.progressReport(companyId); }

  @Get('labour')
  @ApiOperation({ summary: 'Labour report' })
  @RequirePermissions('reports:labour')
  labour(@CompanyId() companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportService.labourReport(companyId, startDate, endDate);
  }
}
