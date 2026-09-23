import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseService } from './purchase.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Purchases')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('purchases')
  @ApiOperation({ summary: 'Create a purchase with project allocations' })
  @RequirePermissions('finance:manage')
  create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.purchaseService.create(companyId, user.sub, data);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'List all purchases (filterable)' })
  @RequirePermissions('finance:view')
  findAll(
    @CompanyId() companyId: string,
    @Query('category') category?: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.purchaseService.findAll(companyId, { category, projectId, startDate, endDate });
  }

  @Get('purchases/categories')
  @ApiOperation({ summary: 'Get purchase breakdown by category' })
  @RequirePermissions('finance:view')
  getCategoryBreakdown(@CompanyId() companyId: string) {
    return this.purchaseService.getCategoryBreakdown(companyId);
  }

  @Get('projects/:projectId/purchases')
  @ApiOperation({ summary: 'List purchases allocated to a project' })
  @RequirePermissions('finance:view')
  findByProject(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.purchaseService.findByProject(projectId, companyId);
  }

  @Get('purchases/:id')
  @ApiOperation({ summary: 'Get purchase details' })
  @RequirePermissions('finance:view')
  findById(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchaseService.findById(id, companyId);
  }

  @Post('purchases/:id/pay')
  @ApiOperation({ summary: 'Mark a bill as paid' })
  @RequirePermissions('finance:manage')
  markPaid(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchaseService.markPaid(id, companyId);
  }

  @Patch('purchases/:id')
  @ApiOperation({ summary: 'Update a purchase' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.purchaseService.update(id, companyId, data);
  }

  @Delete('purchases/:id')
  @ApiOperation({ summary: 'Delete a purchase' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchaseService.delete(id, companyId);
  }
}
