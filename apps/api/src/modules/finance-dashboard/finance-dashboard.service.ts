import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Company-wide financial overview
   * Returns: total advances, total spending, balance, per-project breakdown with budget info
   */
  async getOverview(companyId: string) {
    // Fetch all project wallets
    const wallets = await this.prisma.projectWallet.findMany({
      where: { companyId },
      include: {
        project: {
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
          }
        }
      }
    });

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

    // Bills Summary (Purchases acting as Bills)
    const billsStats = await this.prisma.purchase.groupBy({
      by: ['status'],
      where: { companyId },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    const totalAdvance = Number(totalAdvanceResult._sum.amount || 0);
    const totalSpent = Number(totalSpentResult._sum.amount || 0);
    const totalExpenses = Number(totalExpensesResult._sum.amount || 0);
    const totalRepayments = Number(totalRepaymentsResult._sum.amount || 0);

    const consolidatedSpent = totalSpent + totalExpenses + totalRepayments;

    // Total budget across all projects
    const totalBudget = wallets.reduce((sum, w) => sum + Number(w.project.budgetEstimate || 0), 0);

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

    const projectBreakdown = wallets.map((wallet) => {
      const project = wallet.project;
      const budgetEstimate = Number(project.budgetEstimate || 0);
      const totalAdvance = Number(wallet.totalAllocated);
      const totalSpent = Number(wallet.totalSpent);
      const balance = Number(wallet.balance);
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
        advanceCount: 0, // Legacy support removed for simplicity
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

    const billsSummary = {
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
    };

    for (const bs of billsStats) {
      const total = Number(bs._sum.totalAmount || 0);
      const paid = Number(bs._sum.paidAmount || 0);
      billsSummary.totalAmount += total;
      billsSummary.totalPaid += paid;
      
      if (bs.status === 'PENDING' || bs.status === 'PARTIAL') billsSummary.totalPending += (total - paid);
      if (bs.status === 'OVERDUE') billsSummary.totalOverdue += (total - paid);
    }

    return {
      companyTotals: {
        totalBudget,
        totalAdvance,
        totalSpent: consolidatedSpent,
        balance: totalAdvance - consolidatedSpent,
        billsSummary,
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
  /**
   * Confirm the project belongs to the caller's company before returning any
   * of its financials — the projectId comes straight from the URL.
   */
  private async assertProjectInCompany(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  async getProjectBalance(projectId: string, companyId: string) {
    await this.assertProjectInCompany(projectId, companyId);

    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            budgetEstimate: true,
            budgetActual: true,
            progressPercent: true,
            startDate: true,
            endDate: true,
          }
        }
      }
    });

    const project = wallet?.project;
    const totalAdvance = Number(wallet?.totalAllocated || 0);
    const totalSpent = Number(wallet?.totalSpent || 0);
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
      advanceCount: 0, // Migrated to Project Wallet
      purchaseCount: 0, // Detail queries moved to unified ledger
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
  async getProjectLedger(projectId: string, companyId: string) {
    await this.assertProjectInCompany(projectId, companyId);

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

  /**
   * Enterprise Expense Drill-down
   * Category -> Item (Title) -> Supplier -> Transactions
   */
  async getExpenseDrillDown(companyId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { companyId },
      include: {
        purchasedBy: { select: { firstName: true, lastName: true } },
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { project: { companyId } },
      include: {
        submittedBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Grouping structure: Category -> Item Title -> Vendor/Submitter -> List of Tx
    const tree: any = {};

    const addNode = (cat: string, item: string, vendor: string, tx: any) => {
      const c = cat || 'OTHER';
      const i = item || 'Unknown Item';
      const v = vendor || 'Unknown Vendor';

      if (!tree[c]) tree[c] = { total: 0, items: {} };
      tree[c].total += Number(tx.amount);

      if (!tree[c].items[i]) tree[c].items[i] = { total: 0, vendors: {} };
      tree[c].items[i].total += Number(tx.amount);

      if (!tree[c].items[i].vendors[v]) tree[c].items[i].vendors[v] = { total: 0, transactions: [] };
      tree[c].items[i].vendors[v].total += Number(tx.amount);

      tree[c].items[i].vendors[v].transactions.push(tx);
    };

    for (const p of purchases) {
      addNode(p.category, p.title, p.vendor || 'Supplier', {
        id: p.id,
        type: 'PURCHASE',
        date: p.purchaseDate,
        amount: p.totalAmount,
        status: p.status,
        user: `${p.purchasedBy.firstName} ${p.purchasedBy.lastName}`,
        receiptUrl: p.receiptUrl,
      });
    }

    for (const e of expenses) {
      addNode(e.category, e.title, 'Employee Reimbursement', {
        id: e.id,
        type: 'EXPENSE',
        date: e.expenseDate,
        amount: e.amount,
        status: e.status,
        user: `${e.submittedBy.firstName} ${e.submittedBy.lastName}`,
        receiptUrl: e.receiptUrl,
      });
    }

    return tree;
  }

  /**
   * Enterprise Bills Dashboard
   */
  async getBills(companyId: string) {
    const bills = await this.prisma.purchase.findMany({
      where: { companyId },
      include: {
        allocations: { include: { project: { select: { name: true, id: true } } } },
        purchasedBy: { select: { firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const categories = {
      pending: [] as any[],
      paid: [] as any[],
      overdue: [] as any[],
      upcoming: [] as any[],
    };

    let totalPending = 0;
    let totalOverdue = 0;

    for (const b of bills) {
      const balance = Number(b.totalAmount) - Number(b.paidAmount);
      
      const billData = {
        id: b.id,
        vendor: b.vendor || 'Unknown Vendor',
        title: b.title,
        totalAmount: Number(b.totalAmount),
        paidAmount: Number(b.paidAmount),
        balance,
        status: b.status,
        dueDate: b.dueDate,
        purchasedBy: b.purchasedBy,
        projects: b.allocations.map(a => a.project),
      };

      if (b.status === 'PAID') {
        categories.paid.push(billData);
      } else if (b.status === 'OVERDUE' || (b.dueDate && new Date(b.dueDate) < now)) {
        categories.overdue.push(billData);
        totalOverdue += balance;
      } else {
        if (b.dueDate && new Date(b.dueDate) > now) {
          categories.upcoming.push(billData);
        } else {
          categories.pending.push(billData);
        }
        totalPending += balance;
      }
    }

    return {
      totalPending,
      totalOverdue,
      categories,
    };
  }
}
