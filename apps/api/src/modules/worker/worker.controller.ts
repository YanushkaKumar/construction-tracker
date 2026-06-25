import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkerService } from './worker.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Workers')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('workers')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get()
  @ApiOperation({ summary: 'List workers' })
  findAll(@CompanyId() companyId: string) { return this.workerService.findAll(companyId); }

  @Post()
  @ApiOperation({ summary: 'Create worker' })
  create(@CompanyId() companyId: string, @Body() data: any) { return this.workerService.create(companyId, data); }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker details' })
  findOne(@Param('id') id: string) { return this.workerService.findById(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worker' })
  update(@Param('id') id: string, @Body() data: any) { return this.workerService.update(id, data); }
}
