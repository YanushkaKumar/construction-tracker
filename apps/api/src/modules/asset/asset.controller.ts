import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssetService } from './asset.service';
import { CompanyId, CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new asset' })
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.assetService.create(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all company assets' })
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
  findById(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.findById(id, companyId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign asset to a project' })
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
  returnAsset(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() data: any,
  ) {
    return this.assetService.returnAsset(id, companyId, data);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get asset assignment history' })
  getHistory(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.getHistory(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset details' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.assetService.update(id, companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.assetService.delete(id, companyId);
  }
}
