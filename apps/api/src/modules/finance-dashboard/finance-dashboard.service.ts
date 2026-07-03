import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Company-wide financial overview
   * Returns: total advances, total spending, balance, per-project breakdown with budget info
   */
  async getOverview(companyId: string) {
    // Get all projects with budget info
    const projects = await this.prisma.project.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        budgetEstimate: true,
        budgetActual: true,
        progressPercent: true,
        startDate: true,
        endDate: true,
      },
    });

    // Aggregate advances per project
    const advances = await this.prisma.projectAdvance.groupBy({
      by: ['projectId'],
      where: { companyId, status: { in: ['RECEIVED', 'PARTIAL_RETURN'] } },
      _sum: { amount: true },
      _count: true,
    });

    // Aggregate purchase allocations per project
    const allocations = await this.prisma.purchaseAllocation.groupBy({
      by: ['projectId'],
      where: { purchase: { companyId } },
      _sum: { amount: true },
    });

    // Company-wide totals
    const totalAdvanceResult = await this.prisma.projectAdvance.aggregate({
      where: { companyId, status: { in: ['RECEIVED', 'PARTIAL_RETURN'] } },
      _sum: { amount: true },
    });

    const totalSpentResult = await this.prisma.purchaseAllocation.aggregate({
      where: { purchase: { companyId } },
      _sum: { amount: true },
    });

    const totalExpensesResult = await this.prisma.expense.aggregate({
      where: { project: { companyId }, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true },
    });

    const totalRepaymentsResult = await this.prisma.bankLoanRepayment.aggregate({
      where: { bankLoan: { companyId } },
      _sum: { amount: true },
    });

    const totalAdvance = Number(totalAdvanceResult._sum.amount || 0);
    const totalSpent = Number(totalSpentResult._sum.amount || 0);
    const totalExpenses = Number(totalExpensesResult._sum.amount || 0);
    const totalRepayments = Number(totalRepaymentsResult._sum.amount || 0);

    const consolidatedSpent = totalSpent + totalExpenses + totalRepayments;

    // Total budget across all projects
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budgetEstimate || 0), 0);

    // Spending by category
    const categoryBreakdown = await this.prisma.purchase.groupBy({
      by: ['category'],
      where: { companyId },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Asset stats
    const assetStats = await this.prisma.asset.groupBy({
      by: ['condition'],
      where: { companyId },
      _count: true,
    });

    const totalAssets = await this.prisma.asset.count({ where: { companyId } });
    const assignedAssets = await this.prisma.asset.count({
      where: { companyId, currentProjectId: { not: null } },
    });

    // Task stats for work progress
    const taskStats = await this.prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { project: { companyId } },
      _count: true,
    });

    // Build per-project breakdown
    const advanceMap = Object.fromEntries(
      advances.map((a: any) => [a.projectId, { total: Number(a._sum.amount || 0), count: a._count }]),
    );
    const allocationMap = Object.fromEntries(
      allocations.map((a: any) => [a.projectId, Number(a._sum.amount || 0)]),
    );

    // Build task counts per project
    const taskMap: Record<string, { total: number; completed: number; inProgress: number; todo: number }> = {};
    for (const ts of taskStats) {
      if (!taskMap[ts.projectId]) {
        taskMap[ts.projectId] = { total: 0, completed: 0, inProgress: 0, todo: 0 };
      }
      taskMap[ts.projectId].total += ts._count;
      if (ts.status === 'COMPLETED') taskMap[ts.projectId].completed += ts._count;
      else if (ts.status === 'IN_PROGRESS' || ts.status === 'IN_REVIEW') taskMap[ts.projectId].inProgress += ts._count;
      else taskMap[ts.projectId].todo += ts._count;
    }

    const projectBreakdown = projects.map((project) => {
      const budgetEstimate = Number(project.budgetEstimate || 0);
      const totalAdvance = advanceMap[project.id]?.total || 0;
      const advanceCount = advanceMap[project.id]?.count || 0;
      const totalSpent = allocationMap[project.id] || 0;
      const balance = totalAdvance - totalSpent;
      const remainingToReceive = budgetEstimate - totalAdvance;
      const tasks = taskMap[project.id] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
      const workDonePercent = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : project.progressPercent || 0;

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetEstimate,
        totalAdvance,
        advanceCount,
        totalSpent,
        balance,
        remainingToReceive: remainingToReceive > 0 ? remainingToReceive : 0,
        utilizationPercent: totalAdvance > 0 ? Math.round((totalSpent / totalAdvance) * 100) : 0,
        budgetUtilization: budgetEstimate > 0 ? Math.round((totalSpent / budgetEstimate) * 100) : 0,
        workDonePercent,
        workRemainingPercent: 100 - workDonePercent,
        tasks,
      };
    });

    return {
      companyTotals: {
        totalBudget,
        totalAdvance,
        totalSpent: consolidatedSpent,
        balance: totalAdvance - consolidatedSpent,
      },
      projectBreakdown: projectBreakdown.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
      categoryBreakdown: categoryBreakdown.map((c: any) => ({
        category: c.category,
        total: Number(c._sum.totalAmount || 0),
        count: c._count,
      })),
      assetSummary: {
        total: totalAssets,
        assigned: assignedAssets,
        available: totalAssets - assignedAssets,
        byCondition: assetStats.map((a: any) => ({ condition: a.condition, count: a._count })),
      },
    };
  }

  /**
   * Per-project balance sheet
   */
  async getProjectBalance(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        code: true,
        budgetEstimate: true,
        budgetActual: true,
        progressPercent: true,
        startDate: true,
        endDate: true,
      },
    });

    const [advances, allocations, expenses] = await Promise.all([
      this.prisma.projectAdvance.aggregate({
        where: { projectId, status: { in: ['RECEIVED', 'PARTIAL_RETURN'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.purchaseAllocation.aggregate({
        where: { projectId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalAdvance = Number(advances._sum.amount || 0);
    const totalSpent = Number(allocations._sum.amount || 0) + Number(expenses._sum.amount || 0);
    const budgetEstimate = Number(project?.budgetEstimate || 0);

    // Category breakdown for this project
    const categorySpending = await this.prisma.purchaseAllocation.findMany({
      where: { projectId },
      include: {
        purchase: { select: { category: true, totalAmount: true } },
      },
    });

    const categoryMap: Record<string, number> = {};
    for (const alloc of categorySpending) {
      const cat = alloc.purchase.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(alloc.amount);
    }

    // Add field expenses to category breakdown
    const projectExpenses = await this.prisma.expense.findMany({
      where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
      select: { category: true, amount: true }
    });
    for (const exp of projectExpenses) {
      const cat = exp.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount);
    }

    // Task progress
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    let totalTasks = 0;
    let completedTasks = 0;
    for (const ts of taskStats) {
      totalTasks += ts._count;
      if (ts.status === 'COMPLETED') completedTasks += ts._count;
    }

    return {
      project,
      budgetEstimate,
      totalAdvance,
      totalSpent,
      balance: totalAdvance - totalSpent,
      remainingToReceive: Math.max(budgetEstimate - totalAdvance, 0),
      advanceCount: advances._count,
      purchaseCount: allocations._count + expenses._count,
      utilizationPercent: totalAdvance > 0 ? Math.round((totalSpent / totalAdvance) * 100) : 0,
      budgetUtilization: budgetEstimate > 0 ? Math.round((totalSpent / budgetEstimate) * 100) : 0,
      workDonePercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project?.progressPercent || 0),
      spendingByCategory: Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  }

  /**
   * Per-project transaction ledger with running balance
   */
  async getProjectLedger(projectId: string) {
    const [advances, allocations, expenses] = await Promise.all([
      this.prisma.projectAdvance.findMany({
        where: { projectId },
        include: {
          receivedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { receivedDate: 'asc' },
      }),
      this.prisma.purchaseAllocation.findMany({
        where: { projectId },
        include: {
          purchase: {
            include: {
              purchasedBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.expense.findMany({
        where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
        include: {
          submittedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    // Build unified ledger
    const ledgerEntries: any[] = [];

    for (const adv of advances) {
      ledgerEntries.push({
        id: adv.id,
        type: 'ADVANCE',
        date: adv.receivedDate,
        description: adv.description,
        referenceNo: adv.referenceNo,
        amountIn: Number(adv.amount),
        amountOut: 0,
        user: adv.receivedBy,
        status: adv.status,
      });
    }

    for (const alloc of allocations) {
      ledgerEntries.push({
        id: alloc.id,
        type: 'PURCHASE',
        date: alloc.purchase.purchaseDate,
        description: alloc.purchase.title,
        category: alloc.purchase.category,
        vendor: alloc.purchase.vendor,
        amountIn: 0,
        amountOut: Number(alloc.amount),
        allocationPercent: Number(alloc.percentage),
        purchaseTotalAmount: Number(alloc.purchase.totalAmount),
        user: alloc.purchase.purchasedBy,
        notes: alloc.notes,
      });
    }

    for (const exp of expenses) {
      ledgerEntries.push({
        id: exp.id,
        type: 'EXPENSE',
        date: exp.expenseDate,
        description: exp.title,
        category: exp.category,
        amountIn: 0,
        amountOut: Number(exp.amount),
        user: exp.submittedBy,
        notes: exp.description || null,
        status: exp.status,
      });
    }

    // Sort chronologically
    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Add running balance
    let runningBalance = 0;
    for (const entry of ledgerEntries) {
      runningBalance += entry.amountIn - entry.amountOut;
      entry.runningBalance = runningBalance;
    }

    return {
      entries: ledgerEntries,
      summary: {
        totalIn: ledgerEntries.reduce((sum, e) => sum + e.amountIn, 0),
        totalOut: ledgerEntries.reduce((sum, e) => sum + e.amountOut, 0),
        finalBalance: runningBalance,
      },
    };
  }
}
