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

  async update(id: string, data: any) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async delete(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.delete({ where: { id } });
    return { deleted: true, id };
  }
}
