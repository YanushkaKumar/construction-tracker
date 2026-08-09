import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const count = await this.prisma.project.count({ where: { companyId } });
    const code = `PRJ-${String(count + 1).padStart(3, '0')}`;

    const formattedData = { ...data };
    if (formattedData.startDate) {
      formattedData.startDate = new Date(formattedData.startDate);
    }
    if (formattedData.endDate) {
      formattedData.endDate = new Date(formattedData.endDate);
    }
    if (formattedData.actualEndDate) {
      formattedData.actualEndDate = new Date(formattedData.actualEndDate);
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { ...formattedData, companyId, code },
      });

      await tx.projectWallet.create({
        data: {
          projectId: project.id,
          companyId: project.companyId,
          balance: 0,
          totalAllocated: 0,
          totalSpent: 0,
          reservedAmount: 0,
        },
      });

      return project;
    });
  }

  async findAll(companyId: string, query: PaginationDto & { status?: string }) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
          _count: { select: { tasks: true, expenses: true, dailyReports: true } },
        },
        orderBy: { [query.sort || 'createdAt']: query.order || 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: { total, page: query.page!, limit: query.limit!, totalPages: Math.ceil(total / query.limit!) },
    };
  }

  async findById(id: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } } } },
        _count: { select: { tasks: true, expenses: true, dailyReports: true, attendance: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const advanceAggregate = await this.prisma.projectAdvance.aggregate({
      where: { projectId: id, status: 'RECEIVED' },
      _sum: { amount: true }
    });
    const totalAdvance = Number(advanceAggregate._sum.amount || 0);

    const purchaseAllocationAggregate = await this.prisma.purchaseAllocation.aggregate({
      where: { projectId: id },
      _sum: { amount: true }
    });
    const totalPurchaseSpent = Number(purchaseAllocationAggregate._sum.amount || 0);

    const expenseAggregate = await this.prisma.expense.aggregate({
      where: { projectId: id, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true }
    });
    const totalExpenseSpent = Number(expenseAggregate._sum.amount || 0);

    const totalSpent = totalPurchaseSpent + totalExpenseSpent;
    const remainingAdvance = totalAdvance - totalSpent;
    const contractValue = Number(project.contractValue || 0);
    const remainingToReceive = contractValue - totalAdvance;

    return {
      ...project,
      contractValue,
      totalAdvance,
      totalSpent,
      remainingAdvance,
      remainingToReceive,
    };
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    
    const formattedData = { ...data };
    if (formattedData.startDate) {
      formattedData.startDate = new Date(formattedData.startDate);
    }
    if (formattedData.endDate) {
      formattedData.endDate = new Date(formattedData.endDate);
    }
    if (formattedData.actualEndDate) {
      formattedData.actualEndDate = new Date(formattedData.actualEndDate);
    }

    return this.prisma.project.update({ where: { id }, data: formattedData });
  }

  async getStats(id: string, companyId: string) {
    await this.findById(id, companyId);

    const [taskStats, expenseStats, workerCount] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId: id },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { projectId: id, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.attendance.findMany({
        where: { projectId: id, date: new Date() },
        distinct: ['workerId'],
      }),
    ]);

    return { taskStats, totalExpenses: expenseStats._sum.amount || 0, workersOnSiteToday: workerCount.length };
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return this.prisma.project.delete({ where: { id } });
  }
}
