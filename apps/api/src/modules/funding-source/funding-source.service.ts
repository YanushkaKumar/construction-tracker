import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FundingSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const amount = Number(data.amount || 0);
    return this.prisma.fundingSource.create({
      data: {
        companyId,
        type: data.type || 'COMPANY_CASH',
        name: data.name || 'Company Cash Pool',
        openingBalance: amount,
        currentBalance: amount,
        originalAmount: amount,
        remainingAmount: amount,
        projectId: data.projectId || null,
        status: 'ACTIVE',
      },
    });
  }

  async findAll(companyId: string, projectId?: string) {
    // Automatically make sure default sources exist for this company
    await this.ensureDefaultSources(companyId);

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
    const source = await this.prisma.fundingSource.findFirst({ where: { id, companyId } });
    if (!source) throw new NotFoundException('Funding source not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.amount !== undefined) {
      const amt = Number(data.amount);
      const difference = amt - Number(source.originalAmount);
      updateData.originalAmount = amt;
      updateData.openingBalance = amt;
      updateData.currentBalance = Number(source.currentBalance) + difference;
      updateData.remainingAmount = Number(source.remainingAmount) + difference;
    }

    const updated = await this.prisma.fundingSource.update({
      where: { id },
      data: updateData,
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

  async ensureDefaultSources(companyId: string) {
    const count = await this.prisma.fundingSource.count({ where: { companyId } });
    if (count === 0) {
      // Spawn default Company Cash and Owner Capital pools for new companies
      await this.prisma.fundingSource.createMany({
        data: [
          {
            companyId,
            type: 'COMPANY_CASH',
            name: 'Primary Company Cash Pool',
            openingBalance: 0,
            currentBalance: 0,
            originalAmount: 0,
            remainingAmount: 0,
            status: 'ACTIVE',
          },
          {
            companyId,
            type: 'OWNER_CAPITAL',
            name: 'Director Owner Capital Pool',
            openingBalance: 0,
            currentBalance: 0,
            originalAmount: 0,
            remainingAmount: 0,
            status: 'ACTIVE',
          },
        ],
      });
    }
  }

  async getDashboard(companyId: string) {
    await this.ensureDefaultSources(companyId);

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
        originalAmount,
        currentBalance,
        consumed,
        status: s.status,
        allocations: s.allocations.map((a: any) => ({
          id: a.id,
          amount: Number(a.amount),
          createdAt: a.createdAt,
          title: a.expense?.title || a.purchase?.title || a.asset?.name || 'Labor/Wages Allocation',
        })),
      };
    });

    const currentCash = mapped.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const availableAdvances = mapped.filter(s => s.type === 'PROJECT_ADVANCE').reduce((acc, curr) => acc + curr.currentBalance, 0);
    const loans = mapped.filter(s => s.type === 'BANK_LOAN').reduce((acc, curr) => acc + curr.currentBalance, 0);
    const companyFunds = mapped.filter(s => s.type === 'COMPANY_CASH' || s.type === 'OWNER_CAPITAL').reduce((acc, curr) => acc + curr.currentBalance, 0);

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

    const totalLoansAmount = mapped.filter(s => s.type === 'BANK_LOAN').reduce((acc, curr) => acc + curr.originalAmount, 0);
    const currentLoansBalance = mapped.filter(s => s.type === 'BANK_LOAN').reduce((acc, curr) => acc + curr.currentBalance, 0);
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

    return {
      currentCash,
      availableAdvances,
      loans,
      companyFunds,
      sources: mapped,
      timeline,
      insights,
      allocationMatrix,
    };
  }
}
