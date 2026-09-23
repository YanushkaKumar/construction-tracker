import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkerService } from './worker.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Workers')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('workers')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List workers' })
  @RequirePermissions('workers:view')
  findAll(@CompanyId() companyId: string) { return this.workerService.findAll(companyId); }

  @Post()
  @ApiOperation({ summary: 'Create worker' })
  @RequirePermissions('workers:manage')
  create(@CompanyId() companyId: string, @Body() data: any) { return this.workerService.create(companyId, data); }

  @Get('payroll-summary')
  @ApiOperation({ summary: 'Get payroll summary' })
  @RequirePermissions('reports:labour')
  payrollSummary(@CompanyId() companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.attendanceService.getPayrollSummary(companyId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker details' })
  @RequirePermissions('workers:view')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.workerService.findById(id, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a worker, or deactivate one with attendance history' })
  @RequirePermissions('workers:manage')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.workerService.remove(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worker' })
  @RequirePermissions('workers:manage')
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.workerService.update(id, companyId, data);
  }
}
