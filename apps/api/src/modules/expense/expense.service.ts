import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, submittedById: string, data: any) {
    return this.prisma.expense.create({
      data: { ...data, projectId, submittedById, expenseDate: new Date(data.expenseDate) },
      include: { submittedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findByProject(projectId: string, status?: string) {
    return this.prisma.expense.findMany({
      where: { projectId, ...(status ? { status: status as any } : {}) },
      include: {
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending(companyId: string) {
    return this.prisma.expense.findMany({
      where: { status: 'PENDING', project: { companyId } },
      include: {
        project: { select: { id: true, name: true, code: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string, approvedById: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (expense?.status !== 'PENDING') throw new ForbiddenException('Expense is not pending');

    return this.prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async reject(id: string, approvedById: string, reason: string) {
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'REJECTED', approvedById, rejectionReason: reason },
    });
  }
}
