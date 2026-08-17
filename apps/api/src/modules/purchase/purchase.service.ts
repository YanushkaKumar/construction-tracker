import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProjectActualBudget(projectId: string) {
    const allocationsSum = await this.prisma.purchaseAllocation.aggregate({
      where: { projectId },
      _sum: { amount: true }
    });
    const expensesSum = await this.prisma.expense.aggregate({
      where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true }
    });
    const totalSpent = Number(allocationsSum._sum.amount || 0) + Number(expensesSum._sum.amount || 0);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { budgetActual: totalSpent }
    });
  }

  async create(companyId: string, purchasedById: string, data: any) {
    const { allocations, fundingAllocations, registerAsAsset, ...purchaseData } = data;
    const totalAmount = Number(purchaseData.totalAmount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Process project cost allocations
      if (allocations && allocations.length > 0) {
        const totalAllocated = allocations.reduce(
          (sum: number, a: any) => sum + Number(a.amount),
          0,
        );
        if (Math.abs(totalAllocated - totalAmount) > 0.01) {
          throw new BadRequestException(
            `Project allocation total (${totalAllocated.toLocaleString()}) does not match purchase total (${totalAmount.toLocaleString()})`,
          );
        }
      }

      // 2. Process funding source allocations
      let fundingAllocationsToProcess = fundingAllocations || [];
      if (fundingAllocationsToProcess.length === 0) {
        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        fundingAllocationsToProcess = [{ fundingSourceId: companyCash.id, amount: totalAmount }];
      }

      const fundingAllocatedSum = fundingAllocationsToProcess.reduce(
        (sum: number, a: any) => sum + Number(a.amount),
        0,
      );
      if (Math.abs(fundingAllocatedSum - totalAmount) > 0.01) {
        throw new BadRequestException(
          `Funding source allocation total (LKR ${fundingAllocatedSum.toLocaleString()}) does not match purchase total (LKR ${totalAmount.toLocaleString()})`,
        );
      }

      // Validate balances and deduct
      for (const fa of fundingAllocationsToProcess) {
        const source = await tx.fundingSource.findFirst({ where: { id: fa.fundingSourceId, companyId } });
        if (!source) throw new NotFoundException(`Funding source ${fa.fundingSourceId} not found`);
        if (Number(source.currentBalance) < Number(fa.amount)) {
          throw new BadRequestException(
            `Insufficient balance in funding source "${source.name}". Required: LKR ${Number(fa.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`,
          );
        }

        await tx.fundingSource.update({
          where: { id: source.id },
          data: {
            currentBalance: Number(source.currentBalance) - Number(fa.amount),
            remainingAmount: Number(source.remainingAmount) - Number(fa.amount),
          },
        });
      }

      // Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          companyId,
          purchasedById,
          title: purchaseData.title,
          description: purchaseData.description || null,
          totalAmount: purchaseData.totalAmount,
          category: purchaseData.category,
          purchaseDate: new Date(purchaseData.purchaseDate),
          receiptUrl: purchaseData.receiptUrl || null,
          vendor: purchaseData.vendor || null,
          notes: purchaseData.notes || null,
          bankLoanId: purchaseData.bankLoanId || null,
          allocations: allocations && allocations.length > 0
            ? {
                create: allocations.map((a: any) => ({
                  projectId: a.projectId,
                  amount: a.amount,
                  percentage: a.percentage || ((Number(a.amount) / totalAmount) * 100),
                  notes: a.notes || null,
                })),
              }
            : undefined,
        },
        include: {
          purchasedBy: { select: { id: true, firstName: true, lastName: true } },
          allocations: {
            include: {
              project: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      // Create corresponding Asset record if requested
      if (registerAsAsset) {
        await tx.asset.create({
          data: {
            companyId,
            purchaseId: purchase.id,
            name: purchase.title,
            category: purchase.category || 'EQUIPMENT',
            purchasePrice: totalAmount,
            condition: 'NEW',
            currentProjectId: (allocations && allocations.length > 0) ? allocations[0].projectId : null,
            notes: purchase.description || 'Auto-registered from purchase voucher',
          }
        });
      }

      // Write funding allocations
      for (const fa of fundingAllocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: fa.fundingSourceId,
            amount: fa.amount,
            purchaseId: purchase.id,
          },
        });
      }

      // Recalculate budgets
      if (allocations && allocations.length > 0) {
        for (const a of allocations) {
          const allocationsSum = await tx.purchaseAllocation.aggregate({
            where: { projectId: a.projectId },
            _sum: { amount: true }
          });
          const expensesSum = await tx.expense.aggregate({
            where: { projectId: a.projectId, status: { in: ['APPROVED', 'PAID'] } },
            _sum: { amount: true }
          });
          const totalSpent = Number(allocationsSum._sum.amount || 0) + Number(expensesSum._sum.amount || 0);

          await tx.project.update({
            where: { id: a.projectId },
            data: { budgetActual: totalSpent }
          });
        }
      }

      return purchase;
    });
  }

  async findAll(companyId: string, filters?: {
    category?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { companyId };
    if (filters?.category) where.category = filters.category;
    if (filters?.projectId) {
      where.allocations = { some: { projectId: filters.projectId } };
    }
    if (filters?.startDate || filters?.endDate) {
      where.purchaseDate = {};
      if (filters?.startDate) where.purchaseDate.gte = new Date(filters.startDate);
      if (filters?.endDate) where.purchaseDate.lte = new Date(filters.endDate);
    }

    return this.prisma.purchase.findMany({
      where,
      include: {
        purchasedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: {
          include: {
            project: { select: { id: true, name: true, code: true } },
          },
        },
        fundingAllocations: {
          include: { fundingSource: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findByProject(projectId: string, companyId: string) {
    return this.prisma.purchase.findMany({
      where: {
        companyId,
        allocations: { some: { projectId } },
      },
      include: {
        purchasedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: {
          include: {
            project: { select: { id: true, name: true, code: true } },
          },
        },
        fundingAllocations: {
          include: { fundingSource: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findById(id: string, companyId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, companyId },
      include: {
        purchasedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: {
          include: {
            project: { select: { id: true, name: true, code: true } },
          },
        },
        fundingAllocations: {
          include: { fundingSource: true },
        },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async update(id: string, companyId: string, data: any) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, companyId },
      include: { allocations: true, fundingAllocations: true },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    const oldProjectIds = existing.allocations.map(a => a.projectId);
    const { allocations, fundingAllocations, ...purchaseData } = data;

    const updateData: any = {};
    if (purchaseData.title !== undefined) updateData.title = purchaseData.title;
    if (purchaseData.description !== undefined) updateData.description = purchaseData.description;
    if (purchaseData.totalAmount !== undefined) updateData.totalAmount = purchaseData.totalAmount;
    if (purchaseData.category !== undefined) updateData.category = purchaseData.category;
    if (purchaseData.purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseData.purchaseDate);
    if (purchaseData.vendor !== undefined) updateData.vendor = purchaseData.vendor;
    if (purchaseData.notes !== undefined) updateData.notes = purchaseData.notes;
    if (purchaseData.receiptUrl !== undefined) updateData.receiptUrl = purchaseData.receiptUrl;
    if (purchaseData.bankLoanId !== undefined) updateData.bankLoanId = purchaseData.bankLoanId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore old funding source balances
      for (const fa of existing.fundingAllocations) {
        await tx.fundingSource.update({
          where: { id: fa.fundingSourceId },
          data: {
            currentBalance: { increment: Number(fa.amount) },
            remainingAmount: { increment: Number(fa.amount) },
          },
        });
      }
      await tx.fundingAllocation.deleteMany({ where: { purchaseId: id } });

      // 2. Validate and deduct new funding allocations
      const totalAmount = Number(purchaseData.totalAmount || existing.totalAmount);
      let fundingAllocationsToProcess = fundingAllocations || [];
      if (fundingAllocationsToProcess.length === 0) {
        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        fundingAllocationsToProcess = [{ fundingSourceId: companyCash.id, amount: totalAmount }];
      }

      const fundingAllocatedSum = fundingAllocationsToProcess.reduce(
        (sum: number, a: any) => sum + Number(a.amount),
        0,
      );
      if (Math.abs(fundingAllocatedSum - totalAmount) > 0.01) {
        throw new BadRequestException(
          `Funding source allocation total (LKR ${fundingAllocatedSum.toLocaleString()}) does not match purchase total (LKR ${totalAmount.toLocaleString()})`,
        );
      }

      for (const fa of fundingAllocationsToProcess) {
        const source = await tx.fundingSource.findFirst({ where: { id: fa.fundingSourceId, companyId } });
        if (!source) throw new NotFoundException(`Funding source ${fa.fundingSourceId} not found`);
        if (Number(source.currentBalance) < Number(fa.amount)) {
          throw new BadRequestException(
            `Insufficient balance in funding source "${source.name}". Required: LKR ${Number(fa.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`,
          );
        }

        await tx.fundingSource.update({
          where: { id: source.id },
          data: {
            currentBalance: Number(source.currentBalance) - Number(fa.amount),
            remainingAmount: Number(source.remainingAmount) - Number(fa.amount),
          },
        });
      }

      // 3. Write new funding allocations
      for (const fa of fundingAllocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: fa.fundingSourceId,
            amount: fa.amount,
            purchaseId: id,
          },
        });
      }

      // 4. Update purchase project cost allocations if provided
      let projectIdsToRecalculate = [...oldProjectIds];
      if (allocations) {
        const totalAllocated = allocations.reduce(
          (sum: number, a: any) => sum + Number(a.amount),
          0,
        );
        if (Math.abs(totalAllocated - totalAmount) > 0.01) {
          throw new BadRequestException(
            `Project cost allocation total (${totalAllocated.toLocaleString()}) does not match purchase total (${totalAmount.toLocaleString()})`,
          );
        }

        await tx.purchaseAllocation.deleteMany({ where: { purchaseId: id } });
        updateData.allocations = {
          create: allocations.map((a: any) => ({
            projectId: a.projectId,
            amount: a.amount,
            percentage: a.percentage || ((Number(a.amount) / totalAmount) * 100),
            notes: a.notes || null,
          })),
        };
        projectIdsToRecalculate = Array.from(new Set([...oldProjectIds, ...allocations.map((a: any) => a.projectId)]));
      }

      const updated = await tx.purchase.update({
        where: { id },
        data: updateData,
        include: {
          purchasedBy: { select: { id: true, firstName: true, lastName: true } },
          allocations: {
            include: {
              project: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      // Recalculate project actuals
      for (const pId of projectIdsToRecalculate) {
        const allocationsProjSum = await tx.purchaseAllocation.aggregate({
          where: { projectId: pId },
          _sum: { amount: true }
        });
        const expensesProjSum = await tx.expense.aggregate({
          where: { projectId: pId, status: { in: ['APPROVED', 'PAID'] } },
          _sum: { amount: true }
        });
        const totalSpent = Number(allocationsProjSum._sum.amount || 0) + Number(expensesProjSum._sum.amount || 0);

        await tx.project.update({
          where: { id: pId },
          data: { budgetActual: totalSpent }
        });
      }

      return updated;
    });
  }

  async delete(id: string, companyId: string) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, companyId },
      include: { allocations: true, fundingAllocations: true },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    const projectIds = existing.allocations.map(a => a.projectId);

    return this.prisma.$transaction(async (tx) => {
      // Restore funding source balances
      for (const fa of existing.fundingAllocations) {
        await tx.fundingSource.update({
          where: { id: fa.fundingSourceId },
          data: {
            currentBalance: { increment: Number(fa.amount) },
            remainingAmount: { increment: Number(fa.amount) },
          },
        });
      }

      const deleted = await tx.purchase.delete({ where: { id } });

      for (const pId of projectIds) {
        const allocationsProjSum = await tx.purchaseAllocation.aggregate({
          where: { projectId: pId },
          _sum: { amount: true }
        });
        const expensesProjSum = await tx.expense.aggregate({
          where: { projectId: pId, status: { in: ['APPROVED', 'PAID'] } },
          _sum: { amount: true }
        });
        const totalSpent = Number(allocationsProjSum._sum.amount || 0) + Number(expensesProjSum._sum.amount || 0);

        await tx.project.update({
          where: { id: pId },
          data: { budgetActual: totalSpent }
        });
      }

      return deleted;
    });
  }

  async getCategoryBreakdown(companyId: string) {
    return this.prisma.purchase.groupBy({
      by: ['category'],
      where: { companyId },
      _sum: { totalAmount: true },
      _count: true,
    });
  }
}
