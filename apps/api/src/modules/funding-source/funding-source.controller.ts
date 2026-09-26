import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FundingSourceService } from './funding-source.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Funding Sources')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('funding-sources')
export class FundingSourceController {
  constructor(private readonly service: FundingSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create funding source with enterprise metadata' })
  @RequirePermissions('finance:manage')
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.service.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List available funding sources' })
  @RequirePermissions('finance:view')
  findAll(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.service.findAll(companyId, projectId);
  }

  @Get('main')
  @ApiOperation({ summary: 'Get the single account every payment is drawn from' })
  @RequirePermissions('finance:view')
  getMain(@CompanyId() companyId: string) {
    return this.service.getMain(companyId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available fund source categories and types' })
  @RequirePermissions('finance:view')
  getCategories() {
    return this.service.getSourceCategories();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated cash balance metrics with category grouping' })
  @RequirePermissions('finance:view')
  getDashboard(@CompanyId() companyId: string) {
    return this.service.getDashboard(companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update funding source' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.service.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove funding source' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.service.delete(id, companyId);
  }
}
