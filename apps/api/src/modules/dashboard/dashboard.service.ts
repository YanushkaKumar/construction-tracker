import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeProjects,
      totalProjects,
      pendingExpenses,
      pendingExpenseAmount,
      todayWorkers,
      recentActivities,
      projectsByStatus,
      expenseByCategory,
    ] = await Promise.all([
      this.prisma.project.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      this.prisma.project.count({ where: { companyId } }),
      this.prisma.expense.count({ where: { status: 'PENDING', project: { companyId } } }),
      this.prisma.expense.aggregate({ where: { status: 'PENDING', project: { companyId } }, _sum: { amount: true } }),
      this.prisma.attendance.findMany({ where: { project: { companyId }, date: today }, distinct: ['workerId'] }),
      this.prisma.auditLog.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { firstName: true, lastName: true } } } }),
      this.prisma.project.groupBy({ by: ['status'], where: { companyId }, _count: true }),
      this.prisma.expense.groupBy({ by: ['category'], where: { project: { companyId }, status: 'APPROVED' }, _sum: { amount: true } }),
    ]);

    // Budget utilization
    const budgetData = await this.prisma.project.aggregate({
      where: { companyId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
      _sum: { budgetEstimate: true, budgetActual: true },
    });

    const budgetEstimate = Number(budgetData._sum.budgetEstimate || 0);
    const budgetActual = Number(budgetData._sum.budgetActual || 0);

    return {
      kpis: {
        activeProjects,
        totalProjects,
        budgetUtilization: budgetEstimate > 0 ? Math.round((budgetActual / budgetEstimate) * 100) : 0,
        pendingExpenses,
        pendingExpenseAmount: Number(pendingExpenseAmount._sum.amount || 0),
        workersOnSite: todayWorkers.length,
      },
      charts: {
        projectsByStatus: projectsByStatus.map((p) => ({ status: p.status, count: p._count })),
        expenseByCategory: expenseByCategory.map((e) => ({ category: e.category, total: Number(e._sum.amount || 0) })),
      },
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        user: `${a.user.firstName} ${a.user.lastName}`,
        createdAt: a.createdAt,
      })),
    };
  }
}
