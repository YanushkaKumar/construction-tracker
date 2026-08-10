import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load a task only if it belongs to the given company. Tasks have no direct
   * companyId, so tenancy is enforced through the owning project.
   */
  private async findScoped(id: string, companyId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { companyId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private async assertProjectInCompany(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  async create(projectId: string, creatorId: string, companyId: string, data: any) {
    await this.assertProjectInCompany(projectId, companyId);

    const formattedData = { ...data };
    if (formattedData.dueDate) {
      formattedData.dueDate = new Date(formattedData.dueDate);
    }
    return this.prisma.task.create({
      data: { ...formattedData, projectId, creatorId },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findAllByProject(projectId: string, companyId: string, status?: string) {
    return this.prisma.task.findMany({
      where: { projectId, project: { companyId }, ...(status ? { status: status as any } : {}) },
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

  async findById(id: string, companyId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { companyId } },
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

  async updateStatus(id: string, companyId: string, status: string) {
    await this.findScoped(id, companyId);

    return this.prisma.task.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async addComment(taskId: string, userId: string, companyId: string, content: string, attachments: string[] = []) {
    await this.findScoped(taskId, companyId);

    return this.prisma.taskComment.create({
      data: { taskId, userId, content, attachments },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findScoped(id, companyId);

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

  async delete(id: string, companyId: string) {
    await this.findScoped(id, companyId);

    await this.prisma.task.delete({ where: { id } });
    return { deleted: true, id };
  }
}
