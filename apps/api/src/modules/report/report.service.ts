import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseRequiredDateRange } from '../../common/utils/date-range.util';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async budgetVsActual(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId, status: { in: ['UPCOMING', 'DONE'] } },
      select: { id: true, name: true, code: true, budgetEstimate: true, budgetActual: true, progressPercent: true },
    });

    return projects.map((p) => ({
      ...p,
      budgetEstimate: Number(p.budgetEstimate),
      budgetActual: Number(p.budgetActual),
      variance: Number(p.budgetEstimate) - Number(p.budgetActual),
      variancePercent: Number(p.budgetEstimate) > 0
        ? ((Number(p.budgetEstimate) - Number(p.budgetActual)) / Number(p.budgetEstimate)) * 100
        : 0,
    }));
  }

  async expenseBreakdown(companyId: string, projectId?: string) {
    const where: any = { project: { companyId }, status: 'APPROVED' };
    if (projectId) where.projectId = projectId;

    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return expenses.map((e) => ({
      category: e.category,
      total: Number(e._sum.amount || 0),
      count: e._count,
    }));
  }

  async progressReport(companyId: string) {
    return this.prisma.project.findMany({
      where: { companyId },
      select: {
        id: true, name: true, code: true, status: true, progressPercent: true,
        startDate: true, endDate: true,
        _count: { select: { tasks: true, dailyReports: true } },
      },
      orderBy: { progressPercent: 'desc' },
    });
  }

  async labourReport(companyId: string, startDate: string, endDate: string) {
    const { start, end } = parseRequiredDateRange(startDate, endDate);

    const attendance = await this.prisma.attendance.groupBy({
      by: ['projectId'],
      where: {
        worker: { companyId },
        date: { gte: start, lte: end },
      },
      _sum: { dailyWage: true, hoursWorked: true },
      _count: true,
    });

    const projectIds = attendance.map((a) => a.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, code: true },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return attendance.map((a) => ({
      project: projectMap.get(a.projectId),
      totalWage: Number(a._sum.dailyWage || 0),
      totalHours: Number(a._sum.hoursWorked || 0),
      attendanceRecords: a._count,
    }));
  }
}
