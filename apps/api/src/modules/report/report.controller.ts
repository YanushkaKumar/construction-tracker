import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('budget-vs-actual')
  @ApiOperation({ summary: 'Budget vs actual report' })
  budgetVsActual(@CompanyId() companyId: string) { return this.reportService.budgetVsActual(companyId); }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense breakdown report' })
  expenseBreakdown(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.reportService.expenseBreakdown(companyId, projectId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Progress report' })
  progress(@CompanyId() companyId: string) { return this.reportService.progressReport(companyId); }

  @Get('labour')
  @ApiOperation({ summary: 'Labour report' })
  labour(@CompanyId() companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportService.labourReport(companyId, startDate, endDate);
  }
}
