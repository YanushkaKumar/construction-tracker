import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkerService } from './worker.service';
import { AttendanceService } from '../attendance/attendance.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Workers')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('workers')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List workers' })
  findAll(@CompanyId() companyId: string) { return this.workerService.findAll(companyId); }

  @Post()
  @ApiOperation({ summary: 'Create worker' })
  create(@CompanyId() companyId: string, @Body() data: any) { return this.workerService.create(companyId, data); }

  @Get('payroll-summary')
  @ApiOperation({ summary: 'Get payroll summary' })
  payrollSummary(@CompanyId() companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.attendanceService.getPayrollSummary(companyId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker details' })
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.workerService.findById(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worker' })
  update(@Param('id') id: string, @CompanyId() companyId: string, @Body() data: any) {
    return this.workerService.update(id, companyId, data);
  }
}
