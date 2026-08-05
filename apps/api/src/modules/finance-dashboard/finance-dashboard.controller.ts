import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FinanceDashboardService } from './finance-dashboard.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Finance Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('finance')
export class FinanceDashboardController {
  constructor(private readonly financeDashboardService: FinanceDashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Company-wide financial overview' })
  getOverview(@CompanyId() companyId: string) {
    return this.financeDashboardService.getOverview(companyId);
  }

  @Get('projects/:projectId/balance')
  @ApiOperation({ summary: 'Per-project financial balance' })
  getProjectBalance(@Param('projectId') projectId: string) {
    return this.financeDashboardService.getProjectBalance(projectId);
  }

  @Get('projects/:projectId/ledger')
  @ApiOperation({ summary: 'Per-project transaction ledger with running balance' })
  getProjectLedger(@Param('projectId') projectId: string) {
    return this.financeDashboardService.getProjectLedger(projectId);
  }

  @Get('expenses/drill-down')
  @ApiOperation({ summary: 'Deep drill-down of all expenses/purchases by category, item, and supplier' })
  getExpenseDrillDown(@CompanyId() companyId: string) {
    return this.financeDashboardService.getExpenseDrillDown(companyId);
  }

  @Get('bills')
  @ApiOperation({ summary: 'Enterprise Bills Dashboard' })
  getBills(@CompanyId() companyId: string) {
    return this.financeDashboardService.getBills(companyId);
  }
}
