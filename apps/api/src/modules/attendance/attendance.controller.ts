import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { CompanyId, CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('projects/:projectId/attendance')
  @ApiOperation({ summary: 'Mark attendance (batch)' })
  markBatch(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body('records') records: any[]) {
    return this.attendanceService.markBatch(projectId, user.sub, records);
  }

  @Get('projects/:projectId/attendance')
  @ApiOperation({ summary: 'List project attendance' })
  findByProject(@Param('projectId') projectId: string, @Query('date') date?: string) {
    return this.attendanceService.findByProject(projectId, date);
  }

  @Get('workers/payroll-summary')
  @ApiOperation({ summary: 'Get payroll summary' })
  payrollSummary(@CompanyId() companyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.attendanceService.getPayrollSummary(companyId, startDate, endDate);
  }
}
