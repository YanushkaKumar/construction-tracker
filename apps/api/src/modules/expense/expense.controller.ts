import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExpenseService } from './expense.service';
import { CompanyId, CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post('projects/:projectId/expenses')
  @ApiOperation({ summary: 'Submit expense' })
  create(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.expenseService.create(projectId, user.sub, data);
  }

  @Get('projects/:projectId/expenses')
  @ApiOperation({ summary: 'List project expenses' })
  findByProject(@Param('projectId') projectId: string, @Query('status') status?: string) {
    return this.expenseService.findByProject(projectId, status);
  }

  @Get('expenses/pending')
  @ApiOperation({ summary: 'Get pending expense approvals' })
  findPending(@CompanyId() companyId: string) {
    return this.expenseService.findPending(companyId);
  }

  @Post('expenses/:id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expenseService.approve(id, user.sub);
  }

  @Post('expenses/:id/reject')
  @ApiOperation({ summary: 'Reject expense' })
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body('reason') reason: string) {
    return this.expenseService.reject(id, user.sub, reason);
  }
}
