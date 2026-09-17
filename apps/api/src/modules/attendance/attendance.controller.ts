import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { CompanyId, CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('projects/:projectId/attendance')
  @ApiOperation({ summary: 'Mark attendance (batch)' })
  @RequirePermissions('attendance:mark')
  markBatch(@Param('projectId') projectId: string, @CompanyId() companyId: string, @CurrentUser() user: JwtPayload, @Body('records') records: any[]) {
    return this.attendanceService.markBatch(projectId, companyId, user.sub, records);
  }

  @Get('projects/:projectId/attendance')
  @ApiOperation({ summary: 'List project attendance' })
  @RequirePermissions('attendance:view')
  findByProject(@Param('projectId') projectId: string, @CompanyId() companyId: string, @Query('date') date?: string) {
    return this.attendanceService.findByProject(projectId, companyId, date);
  }
}
