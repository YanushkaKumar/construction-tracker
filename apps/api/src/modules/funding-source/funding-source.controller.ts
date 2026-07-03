import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FundingSourceService } from './funding-source.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Funding Sources')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('funding-sources')
export class FundingSourceController {
  constructor(private readonly service: FundingSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create manual capital injection funding source' })
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.service.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List available funding sources' })
  findAll(@CompanyId() companyId: string, @Query('projectId') projectId?: string) {
    return this.service.findAll(companyId, projectId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated cash balance metrics' })
  getDashboard(@CompanyId() companyId: string) {
    return this.service.getDashboard(companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update manual capital source' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.service.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove manual funding source' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.service.delete(id, companyId);
  }
}
