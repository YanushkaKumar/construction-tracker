import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BOQService } from './boq.service';

@ApiTags('BOQ')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class BOQController {
  constructor(private readonly boqService: BOQService) {}

  // ── Sections ──────────────────────────────

  @Post('projects/:projectId/boq/sections')
  @ApiOperation({ summary: 'Create a BOQ section' })
  createSection(@Param('projectId') projectId: string, @Body() data: any) {
    return this.boqService.createSection(projectId, data);
  }

  @Get('projects/:projectId/boq')
  @ApiOperation({ summary: 'Get full BOQ with sections and items' })
  getBOQ(@Param('projectId') projectId: string) {
    return this.boqService.getProjectBOQSummary(projectId);
  }

  @Patch('boq/sections/:id')
  @ApiOperation({ summary: 'Update a BOQ section' })
  updateSection(@Param('id') id: string, @Body() data: any) {
    return this.boqService.updateSection(id, data);
  }

  @Delete('boq/sections/:id')
  @ApiOperation({ summary: 'Delete a BOQ section' })
  deleteSection(@Param('id') id: string) {
    return this.boqService.deleteSection(id);
  }

  // ── Items ─────────────────────────────────

  @Post('boq/sections/:sectionId/items')
  @ApiOperation({ summary: 'Add an item to a BOQ section' })
  createItem(
    @Param('sectionId') sectionId: string,
    @Body() data: any,
  ) {
    return this.boqService.createItem(sectionId, data.projectId, data);
  }

  @Patch('boq/items/:id')
  @ApiOperation({ summary: 'Update a BOQ item' })
  updateItem(@Param('id') id: string, @Body() data: any) {
    return this.boqService.updateItem(id, data);
  }

  @Delete('boq/items/:id')
  @ApiOperation({ summary: 'Delete a BOQ item' })
  deleteItem(@Param('id') id: string) {
    return this.boqService.deleteItem(id);
  }
}
