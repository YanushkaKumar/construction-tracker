import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { CompanyId } from '../../common/decorators';
import { RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @RequirePermissions('projects:create')
  @ApiOperation({ summary: 'Create a new project' })
  create(@CompanyId() companyId: string, @Body() data: any) {
    return this.projectService.create(companyId, data);
  }

  @Get()
  @RequirePermissions('projects:view')
  @ApiOperation({ summary: 'List all projects' })
  findAll(@CompanyId() companyId: string, @Query() query: PaginationDto) {
    return this.projectService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('projects:view')
  @ApiOperation({ summary: 'Get project details' })
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.projectService.findById(id, companyId);
  }

  @Patch(':id')
  @RequirePermissions('projects:manage_assigned')
  @ApiOperation({ summary: 'Update project' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.projectService.update(id, companyId, data);
  }

  @Delete(':id')
  @RequirePermissions('projects:manage_assigned')
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.projectService.delete(id, companyId);
  }

  @Get(':id/stats')
  @RequirePermissions('projects:view')
  @ApiOperation({ summary: 'Get project statistics' })
  getStats(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.projectService.getStats(id, companyId);
  }
}
