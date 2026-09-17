import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @RequirePermissions('projects:view')
  getAdminDashboard(@CompanyId() companyId: string) {
    return this.dashboardService.getAdminDashboard(companyId);
  }
}
