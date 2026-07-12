import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../database/prisma.service';

describe('ExpenseService — money paths', () => {
  let service: ExpenseService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      project: { findFirst: jest.fn(), update: jest.fn() },
      expense: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      },
      fundingSource: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        createMany: jest.fn(),
      },
      fundingAllocation: { create: jest.fn(), deleteMany: jest.fn() },
      purchaseAllocation: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ExpenseService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ExpenseService);
  });

  describe('create', () => {
    const baseData = {
      title: 'Cement purchase',
      category: 'MATERIAL',
      amount: 100_000,
      expenseDate: '2026-07-01',
    };

    it('rejects when allocations do not sum to the expense amount', async () => {
      prisma.project.findFirst.mockResolvedValue({ companyId: 'c1' });

      await expect(
        service.create('p1', 'u1', {
          ...baseData,
          allocations: [
            { fundingSourceId: 'fs1', amount: 60_000 },
            { fundingSourceId: 'fs2', amount: 30_000 }, // sums to 90k, not 100k
          ],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.expense.create).not.toHaveBeenCalled();
      expect(prisma.fundingSource.update).not.toHaveBeenCalled();
    });

    it('rejects when a funding source has insufficient balance', async () => {
      prisma.project.findFirst.mockResolvedValue({ companyId: 'c1' });
      prisma.fundingSource.findUnique.mockResolvedValue({
        id: 'fs1',
        name: 'Cash Pool',
        currentBalance: 50_000,
        remainingAmount: 50_000,
      });

      await expect(
        service.create('p1', 'u1', {
          ...baseData,
          allocations: [{ fundingSourceId: 'fs1', amount: 100_000 }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.expense.create).not.toHaveBeenCalled();
    });

    it('deducts the allocated amount from the funding source on success', async () => {
      prisma.project.findFirst.mockResolvedValue({ companyId: 'c1' });
      prisma.fundingSource.findUnique.mockResolvedValue({
        id: 'fs1',
        name: 'Cash Pool',
        currentBalance: 500_000,
        remainingAmount: 500_000,
      });
      prisma.expense.create.mockResolvedValue({ id: 'e1', title: 'Cement purchase', category: 'MATERIAL', description: null });

      await service.create('p1', 'u1', {
        ...baseData,
        allocations: [{ fundingSourceId: 'fs1', amount: 100_000 }],
      });

      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'fs1' },
        data: { currentBalance: 400_000, remainingAmount: 400_000 },
      });
      expect(prisma.fundingAllocation.create).toHaveBeenCalledWith({
        data: { fundingSourceId: 'fs1', amount: 100_000, expenseId: 'e1' },
      });
    });

    it('falls back to the company cash pool when no allocations are given', async () => {
      prisma.project.findFirst.mockResolvedValue({ companyId: 'c1' });
      prisma.fundingSource.count.mockResolvedValue(1);
      prisma.fundingSource.findFirst.mockResolvedValue({
        id: 'cash',
        name: 'Company Cash',
        currentBalance: 1_000_000,
        remainingAmount: 1_000_000,
      });
      prisma.fundingSource.findUnique.mockResolvedValue({
        id: 'cash',
        name: 'Company Cash',
        currentBalance: 1_000_000,
        remainingAmount: 1_000_000,
      });
      prisma.expense.create.mockResolvedValue({ id: 'e1', title: 'Cement purchase', category: 'MATERIAL', description: null });

      await service.create('p1', 'u1', { ...baseData, allocations: [] });

      expect(prisma.fundingAllocation.create).toHaveBeenCalledWith({
        data: { fundingSourceId: 'cash', amount: 100_000, expenseId: 'e1' },
      });
    });

    it('throws when the project does not exist', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.create('missing', 'u1', baseData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('approves a pending expense and recalculates the project budget', async () => {
      prisma.expense.findUnique.mockResolvedValue({ id: 'e1', status: 'PENDING', projectId: 'p1' });
      prisma.expense.update.mockResolvedValue({ id: 'e1', status: 'APPROVED', projectId: 'p1' });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 100_000 } });

      const result = await service.approve('e1', 'approver');

      expect(result.status).toBe('APPROVED');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { budgetActual: 100_000 },
      });
    });

    it('refuses to approve a non-pending expense', async () => {
      prisma.expense.findUnique.mockResolvedValue({ id: 'e1', status: 'APPROVED', projectId: 'p1' });
      await expect(service.approve('e1', 'approver')).rejects.toThrow(ForbiddenException);
      expect(prisma.expense.update).not.toHaveBeenCalled();
    });

    it('refuses to approve a missing expense', async () => {
      prisma.expense.findUnique.mockResolvedValue(null);
      await expect(service.approve('nope', 'approver')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reject', () => {
    it('restores funding source balances for every allocation', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'PENDING',
        projectId: 'p1',
        allocations: [
          { fundingSourceId: 'fs1', amount: 60_000 },
          { fundingSourceId: 'fs2', amount: 40_000 },
        ],
      });
      prisma.expense.update.mockResolvedValue({ id: 'e1', status: 'REJECTED', projectId: 'p1' });

      await service.reject('e1', 'approver', 'duplicate voucher');

      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'fs1' },
        data: { currentBalance: { increment: 60_000 }, remainingAmount: { increment: 60_000 } },
      });
      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'fs2' },
        data: { currentBalance: { increment: 40_000 }, remainingAmount: { increment: 40_000 } },
      });
    });

    it('throws when the expense does not exist', async () => {
      prisma.expense.findUnique.mockResolvedValue(null);
      await expect(service.reject('nope', 'approver', 'reason')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('restores balances before deleting', async () => {
      prisma.expense.findFirst.mockResolvedValue({
        id: 'e1',
        projectId: 'p1',
        allocations: [{ fundingSourceId: 'fs1', amount: 25_000 }],
      });
      prisma.expense.delete.mockResolvedValue({ id: 'e1', projectId: 'p1' });

      await service.delete('e1', 'c1');

      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'fs1' },
        data: { currentBalance: { increment: 25_000 }, remainingAmount: { increment: 25_000 } },
      });
      expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });

    it('scopes deletion to the company (cannot delete another company’s expense)', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);
      await expect(service.delete('e1', 'other-company')).rejects.toThrow(NotFoundException);
      expect(prisma.expense.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateProjectActualBudget', () => {
    it('sums purchase allocations and approved/paid expenses', async () => {
      prisma.purchaseAllocation.aggregate.mockResolvedValue({ _sum: { amount: 150_000 } });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 250_000 } });

      await service.updateProjectActualBudget('p1');

      expect(prisma.expense.aggregate).toHaveBeenCalledWith({
        where: { projectId: 'p1', status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true },
      });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { budgetActual: 400_000 },
      });
    });
  });
});
