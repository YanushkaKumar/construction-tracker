import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseAmount } from '../../common/utils/money.util';
import { creditMainAccount, debitMainAccount } from '../../common/utils/main-account.util';

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

  async create(projectId: string, companyId: string, submittedById: string, data: any) {
    const amount = parseAmount(data.amount, 'Expense amount');

    return this.prisma.$transaction(async (tx) => {
      // Scope by the caller's companyId (from their token) — looking the
      // project up by id alone would let one tenant post expenses into
      // another tenant's project.
      const project = await tx.project.findFirst({
        where: { id: projectId, companyId },
        select: { id: true }
      });
      if (!project) throw new NotFoundException('Project not found');

      // Every payment comes out of the one company balance. Expenses used to
      // carry a list of funding allocations chosen in the UI, which let the
      // same money look available in several pools at once; the request may
      // still send that list, but it no longer decides anything.
      const mainAccount = await debitMainAccount(tx, companyId, amount, 'expense');

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

      // One allocation row against the main account keeps the ledger and the
      // existing finance reports intact.
      await tx.fundingAllocation.create({
        data: {
          fundingSourceId: mainAccount.id,
          amount,
          expenseId: expense.id,
        }
      });

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

  async approve(id: string, companyId: string, approvedById: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, project: { companyId } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'PENDING') throw new ForbiddenException('Expense is not pending');

    const result = await this.prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });

    await this.updateProjectActualBudget(result.projectId);
    return result;
  }

  async reject(id: string, companyId: string, approvedById: string, reason: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, project: { companyId } },
      include: { allocations: true }
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status === 'REJECTED') {
      throw new BadRequestException('This expense has already been rejected');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.expense.update({
        where: { id },
        data: { status: 'REJECTED', approvedById, rejectionReason: reason },
      });

      // Refunds go back to the one company balance, not to whichever pool the
      // allocation row happens to name — older rows still point at pools that
      // no longer hold money.
      for (const alloc of expense.allocations) {
        await creditMainAccount(tx, companyId, Number(alloc.amount));
      }

      // Drop the allocation rows once refunded. They are what a refund is
      // computed from, so leaving them behind let the same expense be
      // refunded again — rejecting twice, or rejecting and then deleting,
      // credited the balance twice for one payment.
      await tx.fundingAllocation.deleteMany({ where: { expenseId: id } });

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
      // Put the old amount back, then take the new one: both sides move the
      // single company balance, so an edit nets out to the difference.
      for (const alloc of expense.allocations) {
        await creditMainAccount(tx, companyId, Number(alloc.amount));
      }
      await tx.fundingAllocation.deleteMany({ where: { expenseId: id } });

      const amount = data.amount !== undefined ? parseAmount(data.amount, 'Expense amount') : Number(expense.amount);
      const mainAccount = await debitMainAccount(tx, companyId, amount, 'expense');

      await tx.fundingAllocation.create({
        data: {
          fundingSourceId: mainAccount.id,
          amount,
          expenseId: id,
        }
      });

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
        await creditMainAccount(tx, companyId, Number(alloc.amount));
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
