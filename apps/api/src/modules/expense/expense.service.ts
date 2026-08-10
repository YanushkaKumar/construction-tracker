import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExpenseService {
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

  async create(projectId: string, submittedById: string, data: any) {
    const amount = Number(data.amount || 0);
    const rawAllocations = data.allocations || [];

    return this.prisma.$transaction(async (tx) => {
      // Find companyId from project
      const project = await tx.project.findFirst({
        where: { id: projectId },
        select: { companyId: true }
      });
      if (!project) throw new NotFoundException('Project not found');
      const companyId = project.companyId;

      // Populate default COMPANY_CASH allocation if none provided
      let allocationsToProcess = rawAllocations;
      if (allocationsToProcess.length === 0) {
        // Auto-seed default pools if empty
        const count = await tx.fundingSource.count({ where: { companyId } });
        if (count === 0) {
          await tx.fundingSource.createMany({
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
                sourceCategory: 'capital',
              },
            ],
          });
        }

        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        allocationsToProcess = [{ fundingSourceId: companyCash.id, amount }];
      }

      // Validate allocations sum to total amount
      const allocationsSum = allocationsToProcess.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      if (Math.abs(allocationsSum - amount) > 0.01) {
        throw new BadRequestException(`Allocated funds (LKR ${allocationsSum.toLocaleString()}) must match total expense (LKR ${amount.toLocaleString()})`);
      }

      // Check balance and deduct for each allocation
      for (const alloc of allocationsToProcess) {
        const source = await tx.fundingSource.findFirst({ where: { id: alloc.fundingSourceId, companyId } });
        if (!source) throw new NotFoundException(`Funding source ${alloc.fundingSourceId} not found`);
        if (Number(source.currentBalance) < Number(alloc.amount)) {
          throw new BadRequestException(`Insufficient balance in funding source "${source.name}". Required: LKR ${Number(alloc.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`);
        }

        // Deduct
        await tx.fundingSource.update({
          where: { id: source.id },
          data: {
            currentBalance: Number(source.currentBalance) - Number(alloc.amount),
            remainingAmount: Number(source.remainingAmount) - Number(alloc.amount),
          }
        });
      }

      const expense = await tx.expense.create({
        data: {
          projectId,
          submittedById,
          category: data.category,
          title: data.title,
          description: data.description || null,
          amount: data.amount,
          currency: data.currency || 'LKR',
          receiptUrl: data.receiptUrl || null,
          status: data.status || 'PENDING',
          expenseDate: new Date(data.expenseDate),
          approvedById: data.approvedById || null,
          approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        },
        include: { submittedBy: { select: { id: true, firstName: true, lastName: true } } },
      });

      // Create corresponding Asset record if requested
      if (data.registerAsAsset) {
        await tx.asset.create({
          data: {
            companyId,
            name: expense.title,
            category: expense.category === 'EQUIPMENT' ? 'EQUIPMENT' : 'OTHER',
            purchasePrice: amount,
            condition: 'NEW',
            currentProjectId: projectId,
            notes: expense.description || 'Auto-registered from expense voucher',
          }
        });
      }

      // Save allocation rows
      for (const alloc of allocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: alloc.fundingSourceId,
            amount: alloc.amount,
            expenseId: expense.id,
          }
        });
      }

      // Recalculate project actual budget
      const allocationsProjSum = await tx.purchaseAllocation.aggregate({
        where: { projectId },
        _sum: { amount: true }
      });
      const expensesProjSum = await tx.expense.aggregate({
        where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true }
      });
      const totalSpent = Number(allocationsProjSum._sum.amount || 0) + Number(expensesProjSum._sum.amount || 0);

      await tx.project.update({
        where: { id: projectId },
        data: { budgetActual: totalSpent }
      });

      return expense;
    });
  }

  async findByProject(projectId: string, companyId: string, status?: string) {
    return this.prisma.expense.findMany({
      where: { projectId, project: { companyId }, ...(status ? { status: status as any } : {}) },
      include: {
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: { include: { fundingSource: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByCompany(companyId: string, status?: string) {
    return this.prisma.expense.findMany({
      where: { project: { companyId }, ...(status ? { status: status as any } : {}) },
      include: {
        project: { select: { id: true, name: true, code: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: { include: { fundingSource: true } }
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
        allocations: { include: { fundingSource: true } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string, approvedById: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (expense?.status !== 'PENDING') throw new ForbiddenException('Expense is not pending');

    const result = await this.prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });

    await this.updateProjectActualBudget(result.projectId);
    return result;
  }

  async reject(id: string, approvedById: string, reason: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { allocations: true }
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.expense.update({
        where: { id },
        data: { status: 'REJECTED', approvedById, rejectionReason: reason },
      });

      // Restore balances
      for (const alloc of expense.allocations) {
        await tx.fundingSource.update({
          where: { id: alloc.fundingSourceId },
          data: {
            currentBalance: { increment: Number(alloc.amount) },
            remainingAmount: { increment: Number(alloc.amount) },
          }
        });
      }

      await this.updateProjectActualBudget(result.projectId);
      return result;
    });
  }

  async update(id: string, companyId: string, data: any) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, project: { companyId } },
      include: { allocations: true }
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const oldProjectId = expense.projectId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore old allocations
      for (const alloc of expense.allocations) {
        await tx.fundingSource.update({
          where: { id: alloc.fundingSourceId },
          data: {
            currentBalance: { increment: Number(alloc.amount) },
            remainingAmount: { increment: Number(alloc.amount) },
          }
        });
      }
      // Delete old allocations
      await tx.fundingAllocation.deleteMany({ where: { expenseId: id } });

      // 2. Validate and process new allocations
      const amount = data.amount !== undefined ? Number(data.amount) : Number(expense.amount);
      const rawAllocations = data.allocations || [];

      let allocationsToProcess = rawAllocations;
      if (allocationsToProcess.length === 0) {
        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        allocationsToProcess = [{ fundingSourceId: companyCash.id, amount }];
      }

      // Validate sum matches new/old amount
      const allocationsSum = allocationsToProcess.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      if (Math.abs(allocationsSum - amount) > 0.01) {
        throw new BadRequestException(`Allocated funds (LKR ${allocationsSum.toLocaleString()}) must match total expense (LKR ${amount.toLocaleString()})`);
      }

      // Check balance and deduct new allocations
      for (const alloc of allocationsToProcess) {
        const source = await tx.fundingSource.findFirst({ where: { id: alloc.fundingSourceId, companyId } });
        if (!source) throw new NotFoundException(`Funding source ${alloc.fundingSourceId} not found`);
        if (Number(source.currentBalance) < Number(alloc.amount)) {
          throw new BadRequestException(`Insufficient balance in funding source "${source.name}". Required: LKR ${Number(alloc.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`);
        }

        // Deduct
        await tx.fundingSource.update({
          where: { id: source.id },
          data: {
            currentBalance: Number(source.currentBalance) - Number(alloc.amount),
            remainingAmount: Number(source.remainingAmount) - Number(alloc.amount),
          }
        });
      }

      // 3. Save new allocations
      for (const alloc of allocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: alloc.fundingSourceId,
            amount: alloc.amount,
            expenseId: id,
          }
        });
      }

      // 4. Update the expense record itself
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;

      const updated = await tx.expense.update({
        where: { id },
        data: updateData,
        include: { submittedBy: { select: { id: true, firstName: true, lastName: true } } }
      });

      // Recalculate project actual budget
      const allocationsProjSum = await tx.purchaseAllocation.aggregate({
        where: { projectId: updated.projectId },
        _sum: { amount: true }
      });
      const expensesProjSum = await tx.expense.aggregate({
        where: { projectId: updated.projectId, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true }
      });
      const totalSpent = Number(allocationsProjSum._sum.amount || 0) + Number(expensesProjSum._sum.amount || 0);

      await tx.project.update({
        where: { id: updated.projectId },
        data: { budgetActual: totalSpent }
      });

      if (oldProjectId !== updated.projectId) {
        const oldAllocationsProjSum = await tx.purchaseAllocation.aggregate({
          where: { projectId: oldProjectId },
          _sum: { amount: true }
        });
        const oldExpensesProjSum = await tx.expense.aggregate({
          where: { projectId: oldProjectId, status: { in: ['APPROVED', 'PAID'] } },
          _sum: { amount: true }
        });
        const oldTotalSpent = Number(oldAllocationsProjSum._sum.amount || 0) + Number(oldExpensesProjSum._sum.amount || 0);

        await tx.project.update({
          where: { id: oldProjectId },
          data: { budgetActual: oldTotalSpent }
        });
      }

      return updated;
    });
  }

  async delete(id: string, companyId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, project: { companyId } },
      include: { allocations: true }
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.$transaction(async (tx) => {
      // Restore funding source balances
      for (const alloc of expense.allocations) {
        await tx.fundingSource.update({
          where: { id: alloc.fundingSourceId },
          data: {
            currentBalance: { increment: Number(alloc.amount) },
            remainingAmount: { increment: Number(alloc.amount) },
          }
        });
      }

      const deleted = await tx.expense.delete({ where: { id } });

      // Recalculate project actual budget
      const allocationsProjSum = await tx.purchaseAllocation.aggregate({
        where: { projectId: deleted.projectId },
        _sum: { amount: true }
      });
      const expensesProjSum = await tx.expense.aggregate({
        where: { projectId: deleted.projectId, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true }
      });
      const totalSpent = Number(allocationsProjSum._sum.amount || 0) + Number(expensesProjSum._sum.amount || 0);

      await tx.project.update({
        where: { id: deleted.projectId },
        data: { budgetActual: totalSpent }
      });

      return deleted;
    });
  }
}
