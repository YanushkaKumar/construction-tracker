import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TaskService } from './task.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create task in project' })
  create(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.create(projectId, user.sub, user.companyId, data);
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List project tasks' })
  findByProject(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.taskService.findAllByProject(projectId, user.companyId, status);
  }

  @Get('tasks/my-tasks')
  @ApiOperation({ summary: 'Get current user tasks' })
  myTasks(@CurrentUser() user: JwtPayload) {
    return this.taskService.findMyTasks(user.sub);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task details' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taskService.findById(id, user.companyId);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body('status') status: string) {
    return this.taskService.updateStatus(id, user.companyId, status);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task details' })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.update(id, user.companyId, data);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.taskService.delete(id, user.companyId);
  }

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Add comment to task' })
  addComment(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() data: any) {
    return this.taskService.addComment(id, user.sub, user.companyId, data.content, data.attachments);
  }
}
