import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssetService } from './asset.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new asset' })
  @RequirePermissions('finance:manage')
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.assetService.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all company assets' })
  @RequirePermissions('finance:view')
  findAll(
    @CompanyId() companyId: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.assetService.findAll(companyId, { category, condition, projectId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset details with assignment history' })
  @RequirePermissions('finance:view')
  findById(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.findById(id, companyId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign asset to a project' })
  @RequirePermissions('finance:manage')
  assign(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.assetService.assign(id, companyId, user.sub, data);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Return asset from current project' })
  @RequirePermissions('finance:manage')
  returnAsset(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() data: any,
  ) {
    return this.assetService.returnAsset(id, companyId, data);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get asset assignment history' })
  @RequirePermissions('finance:view')
  getHistory(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.getHistory(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset details' })
  @RequirePermissions('finance:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.assetService.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  @RequirePermissions('finance:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.delete(id, companyId);
  }
}
