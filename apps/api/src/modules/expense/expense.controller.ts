import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExpenseService } from './expense.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post('projects/:projectId/expenses')
  @ApiOperation({ summary: 'Submit expense' })
  @RequirePermissions('expenses:submit')
  create(@Param('projectId') projectId: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.expenseService.create(projectId, companyId, user.sub, data);
  }

  @Get('projects/:projectId/expenses')
  @ApiOperation({ summary: 'List project expenses' })
  @RequirePermissions('expenses:view_all')
  findByProject(@Param('projectId') projectId: string, @CompanyId() companyId: string, @Query('status') status?: string) {
    return this.expenseService.findByProject(projectId, companyId, status);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List all company expenses' })
  @RequirePermissions('expenses:view_all')
  findAllByCompany(@CompanyId() companyId: string, @Query('status') status?: string) {
    return this.expenseService.findAllByCompany(companyId, status);
  }

  @Get('expenses/pending')
  @ApiOperation({ summary: 'Get pending expense approvals' })
  @RequirePermissions('expenses:view_all')
  findPending(@CompanyId() companyId: string) {
    return this.expenseService.findPending(companyId);
  }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  @RequirePermissions('expenses:approve')
  approve(@Param('id') id: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload) {
    return this.expenseService.approve(id, companyId, user.sub);
  }

  @Post('expenses/:id/reject')
  @ApiOperation({ summary: 'Reject expense' })
  @RequirePermissions('expenses:approve')
  reject(@Param('id') id: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload, @Body('reason') reason: string) {
    return this.expenseService.reject(id, companyId, user.sub, reason);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  @RequirePermissions('expenses:submit')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.expenseService.update(id, companyId, data);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  @RequirePermissions('expenses:approve')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.expenseService.delete(id, companyId);
  }
}
