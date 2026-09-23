import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseAmount } from '../../common/utils/money.util';
import { creditMainAccount, getMainAccount } from '../../common/utils/main-account.util';
import { AuditService } from '../audit/audit.service';

// Source category groupings for the enterprise treasury
const SOURCE_CATEGORIES = {
  capital: {
    label: 'Capital & Equity',
    description: 'Company capital, owner investments, and shareholder contributions',
    types: [
      { type: 'COMPANY_CASH', label: 'Company Capital', icon: 'building', description: 'Operating cash from company reserves', fields: ['amount', 'account', 'department', 'date', 'reference', 'approvedBy', 'notes'] },
      { type: 'OWNER_CAPITAL', label: 'Owner Investment', icon: 'user', description: 'Personal capital injected by owner', fields: ['ownerName', 'investmentType', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'DIRECTOR_INVESTMENT', label: 'Director Investment', icon: 'briefcase', description: 'Capital from company directors', fields: ['directorName', 'investmentType', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'SHAREHOLDER_CONTRIBUTION', label: 'Shareholder Contribution', icon: 'users', description: 'Equity injections from shareholders', fields: ['shareholderName', 'sharePercentage', 'amount', 'paymentMethod', 'reference', 'date', 'notes'] },
      { type: 'INVESTOR_FUNDING', label: 'Investor Funding', icon: 'trending-up', description: 'External investor capital', fields: ['investorName', 'fundingRound', 'amount', 'terms', 'reference', 'date', 'notes'] },
    ],
  },
  loans: {
    label: 'Loans & Credit',
    description: 'Bank loans, emergency loans, and supplier credit lines',
    types: [
      { type: 'BANK_LOAN', label: 'Bank Loan', icon: 'landmark', description: 'Standard bank loan facility', redirect: 'loans' },
      { type: 'EMERGENCY_LOAN', label: 'Emergency Loan', icon: 'alert-triangle', description: 'Short-term emergency financing', fields: ['lenderName', 'amount', 'interestRate', 'duration', 'repaymentDate', 'reference', 'date', 'notes'] },
      { type: 'EQUIPMENT_LOAN', label: 'Equipment Loan', icon: 'wrench', description: 'Equipment financing facility', fields: ['lenderName', 'equipmentDescription', 'amount', 'interestRate', 'duration', 'reference', 'date', 'notes'] },
      { type: 'VEHICLE_LOAN', label: 'Vehicle Loan', icon: 'truck', description: 'Vehicle financing', fields: ['lenderName', 'vehicleDescription', 'amount', 'interestRate', 'duration', 'reference', 'date', 'notes'] },
      { type: 'SUPPLIER_CREDIT', label: 'Supplier Credit', icon: 'package', description: 'Credit line from material suppliers', fields: ['supplierName', 'creditLimit', 'amount', 'terms', 'reference', 'date', 'notes'] },
    ],
  },
  client: {
    label: 'Client Payments',
    description: 'Advances, progress payments, and project revenues from clients',
    types: [
      { type: 'PROJECT_ADVANCE', label: 'Customer Advance', icon: 'dollar-sign', description: 'Mobilization advance from client', redirect: 'advances' },
      { type: 'CLIENT_PROGRESS_PAYMENT', label: 'Client Progress Payment', icon: 'check-circle', description: 'Milestone-based progress payment', fields: ['projectId', 'milestone', 'invoiceNumber', 'certificateNo', 'retentionPercent', 'taxAmount', 'amount', 'date', 'notes'] },
    ],
  },
  internal: {
    label: 'Internal & Other',
    description: 'Internal transfers, asset sales, refunds, grants, and other income',
    types: [
      { type: 'INTERNAL_TRANSFER', label: 'Internal Transfer', icon: 'repeat', description: 'Transfer between accounts or departments', fields: ['fromAccount', 'toAccount', 'reason', 'amount', 'reference', 'date', 'notes'] },
      { type: 'FIXED_DEPOSIT_WITHDRAWAL', label: 'Fixed Deposit Withdrawal', icon: 'lock', description: 'Withdrawal from fixed deposit', fields: ['bankName', 'fdNumber', 'maturityDate', 'amount', 'interestEarned', 'reference', 'date', 'notes'] },
      { type: 'TREASURY_RESERVE', label: 'Treasury Reserve', icon: 'shield', description: 'Reserved funds allocation', fields: ['reservePurpose', 'amount', 'reference', 'date', 'notes'] },
      { type: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: 'life-buoy', description: 'Emergency reserve funds', fields: ['reason', 'amount', 'approvalLevel', 'reference', 'date', 'notes'] },
      { type: 'EQUIPMENT_SALE', label: 'Equipment Sale', icon: 'tag', description: 'Revenue from selling equipment', fields: ['equipmentName', 'buyerName', 'salePrice', 'originalPrice', 'reference', 'date', 'notes'] },
      { type: 'ASSET_SALE', label: 'Asset Sale', icon: 'home', description: 'Revenue from selling assets', fields: ['assetName', 'buyerName', 'salePrice', 'originalPrice', 'reference', 'date', 'notes'] },
      { type: 'REFUND', label: 'Refund', icon: 'rotate-ccw', description: 'Refund received', fields: ['refundFrom', 'originalTransaction', 'reason', 'amount', 'reference', 'date', 'notes'] },
      { type: 'GOVERNMENT_GRANT', label: 'Government Grant', icon: 'award', description: 'Government or institutional grant', fields: ['grantingBody', 'grantName', 'grantNumber', 'amount', 'conditions', 'reference', 'date', 'notes'] },
      { type: 'INSURANCE_CLAIM', label: 'Insurance Claim', icon: 'file-text', description: 'Insurance claim settlement', fields: ['insuranceCompany', 'policyNumber', 'claimNumber', 'amount', 'reference', 'date', 'notes'] },
      { type: 'OTHER_INCOME', label: 'Other Income', icon: 'plus-circle', description: 'Miscellaneous income', fields: ['incomeDescription', 'category', 'amount', 'reference', 'date', 'notes'] },
    ],
  },
};

function getSourceCategory(type: string): string {
  for (const [cat, group] of Object.entries(SOURCE_CATEGORIES)) {
    if (group.types.some((t) => t.type === type)) return cat;
  }
  return 'internal';
}

@Injectable()
export class FundingSourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(companyId: string, data: any, userId?: string) {
    const amount = parseAmount(data.amount, 'Funding amount', { allowZero: true });
    const sourceCategory = data.sourceCategory || getSourceCategory(data.type || 'COMPANY_CASH');

    // Funding is an inflow to the single company balance, not a pool of its
    // own: the row records where the money came from, and the Main Account
    // carries what is actually spendable.
    const source = await this.prisma.$transaction(async (tx) => {
      const created = await tx.fundingSource.create({
      data: {
        companyId,
        type: data.type || 'COMPANY_CASH',
        name: data.name || 'Funding',
        openingBalance: amount,
        currentBalance: 0,
        originalAmount: amount,
        remainingAmount: 0,
        projectId: data.projectId || null,
        status: 'ACTIVE',
        // Enterprise fields
        description: data.description || null,
        referenceNo: data.referenceNo || null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        paymentMethod: data.paymentMethod || null,
        approvedBy: data.approvedBy || null,
        sourceCategory,
        metadata: data.metadata || {},
      },
      });

      if (amount > 0) {
        await creditMainAccount(tx, companyId, amount);
      }

      return created;
    });

    // Audit log the fund source creation
    if (userId) {
      this.auditService.log({
        companyId,
        userId,
        action: 'FUND_SOURCE_CREATED',
        entityType: 'FundingSource',
        entityId: source.id,
        changes: {
          type: data.type,
          name: source.name,
          amount,
          sourceCategory,
          referenceNo: data.referenceNo || null,
          paymentMethod: data.paymentMethod || null,
        },
      });
    }

    return source;
  }

  /**
   * The single account every payment is drawn from. Callers that used to make
   * the user choose a funding source now show this balance instead.
   */
  async getMain(companyId: string) {
    const main = await this.prisma.$transaction((tx) =>
      getMainAccount(tx as any, companyId),
    );
    return {
      ...main,
      openingBalance: Number(main.openingBalance),
      currentBalance: Number(main.currentBalance),
      originalAmount: Number(main.originalAmount),
      remainingAmount: Number(main.remainingAmount),
    };
  }

  async findAll(companyId: string, projectId?: string) {
    const where: any = { companyId };
    if (projectId) {
      where.OR = [
        { projectId },
        { projectId: null }, // Shared pools like Company Cash are always available
      ];
    }

    const sources = await this.prisma.fundingSource.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sources.map(s => ({
      ...s,
      openingBalance: Number(s.openingBalance),
      currentBalance: Number(s.currentBalance),
      originalAmount: Number(s.originalAmount),
      remainingAmount: Number(s.remainingAmount),
    }));
  }

  async update(id: string, companyId: string, data: any) {
    // Read and write in one transaction: resizing a pool is a
    // read-modify-write on its balances, so two concurrent edits done
    // separately would silently drop one.
    const updated = await this.prisma.$transaction(async (tx) => {
      const source = await tx.fundingSource.findFirst({ where: { id, companyId } });
      if (!source) throw new NotFoundException('Funding source not found');

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.amount !== undefined) {
        const amt = parseAmount(data.amount, 'Funding amount', { allowZero: true });

        const difference = amt - Number(source.originalAmount);
        const newCurrent = Number(source.currentBalance) + difference;
        const newRemaining = Number(source.remainingAmount) + difference;

        // Shrinking a pool below what has already been drawn from it would
        // leave a negative balance, which reads as free cash elsewhere.
        if (newCurrent < 0 || newRemaining < 0) {
          const spent = Number(source.originalAmount) - Number(source.remainingAmount);
          throw new BadRequestException(
            `Cannot reduce this funding source to LKR ${amt.toLocaleString()} — ` +
              `LKR ${spent.toLocaleString()} has already been allocated from it.`,
          );
        }

        updateData.originalAmount = amt;
        updateData.openingBalance = amt;
        updateData.currentBalance = newCurrent;
        updateData.remainingAmount = newRemaining;
      }

      return tx.fundingSource.update({ where: { id }, data: updateData });
    });

    return {
      ...updated,
      openingBalance: Number(updated.openingBalance),
      currentBalance: Number(updated.currentBalance),
      originalAmount: Number(updated.originalAmount),
      remainingAmount: Number(updated.remainingAmount),
    };
  }

  async delete(id: string, companyId: string) {
    const source = await this.prisma.fundingSource.findFirst({ where: { id, companyId } });
    if (!source) throw new NotFoundException('Funding source not found');

    // Prevent deleting sources that have allocations
    const count = await this.prisma.fundingAllocation.count({ where: { fundingSourceId: id } });
    if (count > 0) {
      throw new BadRequestException('Cannot delete a funding source that has active transaction allocations');
    }

    return this.prisma.fundingSource.delete({ where: { id } });
  }

  getSourceCategories() {
    return SOURCE_CATEGORIES;
  }

  async getDashboard(companyId: string) {
    const sources = await this.prisma.fundingSource.findMany({
      where: { companyId },
      include: {
        allocations: {
          include: {
            expense: { select: { title: true } },
            purchase: { select: { title: true } },
            asset: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const mapped = sources.map(s => {
      const originalAmount = Number(s.originalAmount);
      const currentBalance = Number(s.currentBalance);
      const consumed = originalAmount - currentBalance;
      return {
        id: s.id,
        type: s.type,
        name: s.name,
        isMain: s.isMain,
        originalAmount,
        currentBalance,
        // Only the Main Account holds a balance, so "consumed" is only
        // meaningful there. Every other row is a record of money coming in;
        // reporting its full amount as consumed made each one read as
        // "Depleted / 100% utilised" the moment it was created.
        consumed: s.isMain ? consumed : 0,
        status: s.status,
        sourceCategory: s.sourceCategory || getSourceCategory(s.type),
        description: s.description,
        referenceNo: s.referenceNo,
        receivedDate: s.receivedDate,
        paymentMethod: s.paymentMethod,
        metadata: s.metadata,
        allocations: s.allocations.map((a: any) => ({
          id: a.id,
          amount: Number(a.amount),
          createdAt: a.createdAt,
          title: a.expense?.title || a.purchase?.title || a.asset?.name || 'Labor/Wages Allocation',
        })),
      };
    });

    // Cash on hand lives in one place now. The three figures beside it report
    // how much came in from each kind of source, which is what they were
    // really being read as; summing balances would report zero for all of
    // them, because only the Main Account carries one.
    const currentCash = mapped.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const receivedFrom = (types: string[]) =>
      mapped.filter(s => !s.isMain && types.includes(s.type)).reduce((acc, curr) => acc + curr.originalAmount, 0);
    const availableAdvances = receivedFrom(['PROJECT_ADVANCE', 'CLIENT_PROGRESS_PAYMENT']);
    const loans = receivedFrom(['BANK_LOAN', 'EMERGENCY_LOAN', 'EQUIPMENT_LOAN', 'VEHICLE_LOAN']);
    const companyFunds = receivedFrom(['COMPANY_CASH', 'OWNER_CAPITAL', 'DIRECTOR_INVESTMENT', 'SHAREHOLDER_CONTRIBUTION', 'INVESTOR_FUNDING']);

    // Timeline calculations: aggregate allocations by month
    const allocations = await this.prisma.fundingAllocation.findMany({
      where: { fundingSource: { companyId } },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const utilizationByMonth: Record<string, number> = {};
    for (const alloc of allocations) {
      const month = new Date(alloc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      utilizationByMonth[month] = (utilizationByMonth[month] || 0) + Number(alloc.amount);
    }

    const timeline = Object.entries(utilizationByMonth).map(([month, amount]) => ({
      month,
      amount,
    }));

    // AI Insights Generator
    const insights: string[] = [];

    const totalLoansAmount = mapped.filter(s => ['BANK_LOAN', 'EMERGENCY_LOAN', 'EQUIPMENT_LOAN', 'VEHICLE_LOAN'].includes(s.type)).reduce((acc, curr) => acc + curr.originalAmount, 0);
    const currentLoansBalance = mapped.filter(s => ['BANK_LOAN', 'EMERGENCY_LOAN', 'EQUIPMENT_LOAN', 'VEHICLE_LOAN'].includes(s.type)).reduce((acc, curr) => acc + curr.currentBalance, 0);
    if (totalLoansAmount > 0) {
      const loanUtilPercent = Math.round(((totalLoansAmount - currentLoansBalance) / totalLoansAmount) * 100);
      insights.push(`Bank loan utilization reached ${loanUtilPercent}%.`);
    }

    const crossAllocations = await this.prisma.fundingAllocation.findMany({
      where: {
        fundingSource: { companyId, type: 'PROJECT_ADVANCE' },
      },
      include: {
        fundingSource: { include: { project: true } },
        expense: { include: { project: true } },
        purchase: { include: { allocations: { include: { project: true } } } },
      }
    });

    for (const alloc of crossAllocations) {
      const sourceProject = alloc.fundingSource.project;
      if (!sourceProject) continue;

      if (alloc.expense && alloc.expense.project && alloc.expense.projectId !== alloc.fundingSource.projectId) {
        const msg = `${alloc.expense.project.name} is currently consuming ${sourceProject.name} client advance.`;
        if (!insights.includes(msg)) {
          insights.push(msg);
        }
      }

      if (alloc.purchase && alloc.purchase.allocations) {
        for (const pAlloc of alloc.purchase.allocations) {
          if (pAlloc.project && pAlloc.projectId !== alloc.fundingSource.projectId) {
            const msg = `${pAlloc.project.name} is currently consuming ${sourceProject.name} client advance.`;
            if (!insights.includes(msg)) {
              insights.push(msg);
            }
          }
        }
      }
    }

    const companyCashAllocations = await this.prisma.fundingAllocation.findMany({
      where: {
        fundingSource: { companyId, type: { in: ['COMPANY_CASH', 'OWNER_CAPITAL'] } },
      },
      include: {
        expense: { include: { project: true } }
      }
    });

    const projectCompanyCashUsage: Record<string, { total: number, name: string }> = {};
    for (const alloc of companyCashAllocations) {
      if (alloc.expense && alloc.expense.projectId) {
        const id = alloc.expense.projectId;
        if (!projectCompanyCashUsage[id]) {
          projectCompanyCashUsage[id] = { total: 0, name: alloc.expense.project.name };
        }
        projectCompanyCashUsage[id].total += Number(alloc.amount);
      }
    }

    for (const [projId, pdata] of Object.entries(projectCompanyCashUsage)) {
      if (pdata.total > 0) {
        const totalProjectCost = await this.prisma.expense.aggregate({
          where: { projectId: projId, status: 'APPROVED' },
          _sum: { amount: true }
        });
        const totalAmount = Number(totalProjectCost._sum.amount || 1);
        const percent = Math.min(Math.round((pdata.total / totalAmount) * 100), 100);
        if (percent > 0) {
          insights.push(`Company cash is covering ${percent}% of ${pdata.name}.`);
        }
      }
    }

    if (insights.length === 0) {
      insights.push('All projects are currently funded via standard client mobilization advances.');
      insights.push('Company treasury cash reserves remain healthy and uncommitted.');
    }

    const allAllocations = await this.prisma.fundingAllocation.findMany({
      where: { fundingSource: { companyId } },
      include: {
        fundingSource: true,
        expense: { select: { projectId: true, project: { select: { name: true } } } },
        purchase: { include: { allocations: { include: { project: true } } } },
        asset: { include: { currentProject: true } },
        attendance: { include: { project: true } },
      }
    });

    const matrixMap: Record<string, { sourceName: string, projects: Record<string, { name: string, amount: number }> }> = {};
    for (const alloc of allAllocations) {
      const sId = alloc.fundingSourceId;
      const sName = alloc.fundingSource.name;
      if (!matrixMap[sId]) {
        matrixMap[sId] = { sourceName: sName, projects: {} };
      }

      const projectLinks: { id: string, name: string }[] = [];
      if (alloc.expense && alloc.expense.projectId) {
        projectLinks.push({ id: alloc.expense.projectId, name: alloc.expense.project?.name || 'General' });
      }
      if (alloc.purchase && alloc.purchase.allocations) {
        for (const pAlloc of alloc.purchase.allocations) {
          projectLinks.push({ id: pAlloc.projectId, name: pAlloc.project?.name || 'General' });
        }
      }
      if (alloc.asset && alloc.asset.currentProjectId) {
        projectLinks.push({ id: alloc.asset.currentProjectId, name: alloc.asset.currentProject?.name || 'General' });
      }
      if (alloc.attendance && alloc.attendance.projectId) {
        projectLinks.push({ id: alloc.attendance.projectId, name: alloc.attendance.project?.name || 'General' });
      }

      if (projectLinks.length === 0) {
        projectLinks.push({ id: 'OVERHEAD', name: 'Company Overhead' });
      }

      const dividedAmount = Number(alloc.amount) / projectLinks.length;
      for (const pLink of projectLinks) {
        if (!matrixMap[sId].projects[pLink.id]) {
          matrixMap[sId].projects[pLink.id] = { name: pLink.name, amount: 0 };
        }
        matrixMap[sId].projects[pLink.id].amount += dividedAmount;
      }
    }

    const allocationMatrix = Object.entries(matrixMap).map(([sourceId, mData]) => ({
      sourceId,
      sourceName: mData.sourceName,
      allocations: Object.entries(mData.projects).map(([projectId, pData]) => ({
        projectId,
        projectName: pData.name,
        amount: pData.amount,
      })),
    }));

    // Group sources by category for dashboard
    const sourcesByCategory: Record<string, any[]> = {};
    for (const source of mapped) {
      const cat = source.sourceCategory || 'internal';
      if (!sourcesByCategory[cat]) sourcesByCategory[cat] = [];
      sourcesByCategory[cat].push(source);
    }

    return {
      currentCash,
      availableAdvances,
      loans,
      companyFunds,
      sources: mapped,
      sourcesByCategory,
      timeline,
      insights,
      allocationMatrix,
    };
  }
}
