import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FundingSourceService } from './funding-source.service';
import { CompanyId, CurrentUser } from '../../common/decorators';

@ApiTags('Funding Sources')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('funding-sources')
export class FundingSourceController {
  constructor(private readonly service: FundingSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create funding source with enterprise metadata' })
  create(@CompanyId() companyId: string, @CurrentUser('sub') userId: string, @Body() data: any) {
    return this.service.create(companyId, data, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List available funding sources' })
  findAll(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.service.findAll(companyId, projectId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available fund source categories and types' })
  getCategories() {
    return this.service.getSourceCategories();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated cash balance metrics with category grouping' })
  getDashboard(@CompanyId() companyId: string) {
    return this.service.getDashboard(companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update funding source' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.service.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove funding source' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.service.delete(id, companyId);
  }
}
