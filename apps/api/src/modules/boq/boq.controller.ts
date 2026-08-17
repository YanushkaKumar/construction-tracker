import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BOQService } from './boq.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('BOQ')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class BOQController {
  constructor(private readonly boqService: BOQService) {}

  // ── Sections ──────────────────────────────

  @Post('projects/:projectId/boq/sections')
  @ApiOperation({ summary: 'Create a BOQ section' })
  createSection(@Param('projectId') projectId: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.boqService.createSection(projectId, companyId, data);
  }

  @Get('projects/:projectId/boq')
  @ApiOperation({ summary: 'Get full BOQ with sections and items' })
  getBOQ(@Param('projectId') projectId: string, @CompanyId() companyId: string) {
    return this.boqService.getProjectBOQSummary(projectId, companyId);
  }

  @Patch('boq/sections/:id')
  @ApiOperation({ summary: 'Update a BOQ section' })
  updateSection(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.boqService.updateSection(id, companyId, data);
  }

  @Delete('boq/sections/:id')
  @ApiOperation({ summary: 'Delete a BOQ section' })
  deleteSection(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.boqService.deleteSection(id, companyId);
  }

  // ── Items ─────────────────────────────────

  @Post('boq/sections/:sectionId/items')
  @ApiOperation({ summary: 'Add an item to a BOQ section' })
  createItem(
    @Param('sectionId') sectionId: string,
    @CompanyId() companyId: string,
    @Body() data: any,
  ) {
    return this.boqService.createItem(sectionId, companyId, data);
  }

  @Patch('boq/items/:id')
  @ApiOperation({ summary: 'Update a BOQ item' })
  updateItem(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.boqService.updateItem(id, companyId, data);
  }

  @Delete('boq/items/:id')
  @ApiOperation({ summary: 'Delete a BOQ item' })
  deleteItem(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.boqService.deleteItem(id, companyId);
  }
}
