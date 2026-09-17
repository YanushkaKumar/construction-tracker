import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create task in project' })
  @RequirePermissions('tasks:create')
  create(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.create(projectId, user.sub, user.companyId, data);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List project tasks' })
  @RequirePermissions('tasks:view')
  findByProject(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.taskService.findAllByProject(projectId, user.companyId, status);
  }

  @Get('tasks/my-tasks')
  @ApiOperation({ summary: 'Get current user tasks' })
  @RequirePermissions('tasks:view')
  myTasks(@CurrentUser() user: JwtPayload) {
    return this.taskService.findMyTasks(user.sub);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task details' })
  @RequirePermissions('tasks:view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taskService.findById(id, user.companyId);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status' })
  @RequirePermissions('tasks:update_status')
  updateStatus(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body('status') status: string) {
    return this.taskService.updateStatus(id, user.companyId, status);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task details' })
  @RequirePermissions('tasks:assign')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.update(id, user.companyId, data);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @RequirePermissions('tasks:assign')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taskService.delete(id, user.companyId);
  }

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Add comment to task' })
  @RequirePermissions('tasks:view')
  addComment(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.addComment(id, user.sub, user.companyId, data.content, data.attachments);
  }
}
