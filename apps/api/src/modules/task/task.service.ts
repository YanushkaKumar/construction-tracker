import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, creatorId: string, data: any) {
    const formattedData = { ...data };
    if (formattedData.dueDate) {
      formattedData.dueDate = new Date(formattedData.dueDate);
    }
    return this.prisma.task.create({
      data: { ...formattedData, projectId, creatorId },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findAllByProject(projectId: string, status?: string) {
    return this.prisma.task.findMany({
      where: { projectId, ...(status ? { status: status as any } : {}) },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { comments: true, subTasks: true, images: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId, status: { not: 'COMPLETED' } },
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        comments: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
        subTasks: true,
        images: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async addComment(taskId: string, userId: string, content: string, attachments: string[] = []) {
    return this.prisma.taskComment.create({
      data: { taskId, userId, content, attachments },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });
  }
}
