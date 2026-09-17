import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FinanceDashboardService } from './finance-dashboard.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Finance Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('finance')
export class FinanceDashboardController {
  constructor(private readonly financeDashboardService: FinanceDashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Company-wide financial overview' })
  @RequirePermissions('reports:financial')
  getOverview(@CompanyId() companyId: string) {
    return this.financeDashboardService.getOverview(companyId);
  }

  @Get('projects/:projectId/balance')
  @ApiOperation({ summary: 'Per-project financial balance' })
  @RequirePermissions('reports:financial')
  getProjectBalance(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.financeDashboardService.getProjectBalance(projectId, companyId);
  }

  @Get('projects/:projectId/ledger')
  @ApiOperation({ summary: 'Per-project transaction ledger with running balance' })
  @RequirePermissions('reports:financial')
  getProjectLedger(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.financeDashboardService.getProjectLedger(projectId, companyId);
  }

  @Get('expenses/drill-down')
  @ApiOperation({ summary: 'Deep drill-down of all expenses/purchases by category, item, and supplier' })
  @RequirePermissions('reports:financial')
  getExpenseDrillDown(@CompanyId() companyId: string) {
    return this.financeDashboardService.getExpenseDrillDown(companyId);
  }

  @Get('bills')
  @ApiOperation({ summary: 'Enterprise Bills Dashboard' })
  @RequirePermissions('reports:financial')
  getBills(@CompanyId() companyId: string) {
    return this.financeDashboardService.getBills(companyId);
  }
}
