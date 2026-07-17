import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BankLoanService } from './bank-loan.service';
import { PrismaService } from '../database/prisma.service';

describe('BankLoanService — repayment money paths', () => {
  let service: BankLoanService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      bankLoan: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      bankLoanRepayment: {
        aggregate: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      fundingSource: { findFirst: jest.fn(), update: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [BankLoanService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(BankLoanService);
  });

  describe('createRepayment', () => {
    const loan = { id: 'loan1', companyId: 'c1', loanAmount: 1_000_000 };

    it('rejects a repayment larger than the outstanding balance', async () => {
      prisma.bankLoan.findFirst.mockResolvedValue(loan);
      prisma.bankLoanRepayment.aggregate.mockResolvedValue({ _sum: { amount: 900_000 } });

      await expect(
        service.createRepayment('loan1', 'c1', { amount: 200_000, paymentDate: '2026-07-01' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.bankLoanRepayment.create).not.toHaveBeenCalled();
    });

    it('rejects when company cash cannot cover the repayment', async () => {
      prisma.bankLoan.findFirst.mockResolvedValue(loan);
      prisma.bankLoanRepayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.fundingSource.findFirst.mockResolvedValue({
        id: 'cash',
        currentBalance: 50_000,
        remainingAmount: 50_000,
      });

      await expect(
        service.createRepayment('loan1', 'c1', { amount: 100_000, paymentDate: '2026-07-01' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.bankLoanRepayment.create).not.toHaveBeenCalled();
    });

    it('deducts the repayment from company cash and records it', async () => {
      prisma.bankLoan.findFirst.mockResolvedValue(loan);
      prisma.bankLoanRepayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.fundingSource.findFirst.mockResolvedValue({
        id: 'cash',
        currentBalance: 500_000,
        remainingAmount: 500_000,
      });
      prisma.bankLoanRepayment.create.mockResolvedValue({ id: 'r1', amount: 100_000 });

      await service.createRepayment('loan1', 'c1', { amount: 100_000, paymentDate: '2026-07-01' });

      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'cash' },
        data: { currentBalance: 400_000, remainingAmount: 400_000 },
      });
      expect(prisma.bankLoanRepayment.create).toHaveBeenCalled();
      // Not fully repaid — status must stay untouched
      expect(prisma.bankLoan.update).not.toHaveBeenCalled();
    });

    it('marks the loan PAID_OFF when the final repayment completes it', async () => {
      prisma.bankLoan.findFirst.mockResolvedValue(loan);
      prisma.bankLoanRepayment.aggregate.mockResolvedValue({ _sum: { amount: 900_000 } });
      prisma.fundingSource.findFirst.mockResolvedValue({
        id: 'cash',
        currentBalance: 500_000,
        remainingAmount: 500_000,
      });
      prisma.bankLoanRepayment.create.mockResolvedValue({ id: 'r2', amount: 100_000 });

      await service.createRepayment('loan1', 'c1', { amount: 100_000, paymentDate: '2026-07-01' });

      expect(prisma.bankLoan.update).toHaveBeenCalledWith({
        where: { id: 'loan1' },
        data: { status: 'PAID_OFF' },
      });
    });

    it('scopes the loan lookup to the company', async () => {
      prisma.bankLoan.findFirst.mockResolvedValue(null);
      await expect(
        service.createRepayment('loan1', 'other-company', { amount: 1, paymentDate: '2026-07-01' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRepayment', () => {
    it('restores company cash and reactivates a paid-off loan', async () => {
      prisma.bankLoanRepayment.findFirst.mockResolvedValue({ id: 'r1', bankLoanId: 'loan1' });
      prisma.bankLoanRepayment.delete.mockResolvedValue({ id: 'r1', bankLoanId: 'loan1', amount: 100_000 });
      prisma.fundingSource.findFirst.mockResolvedValue({
        id: 'cash',
        currentBalance: 400_000,
        remainingAmount: 400_000,
      });
      prisma.bankLoan.findUnique.mockResolvedValue({
        id: 'loan1',
        loanAmount: 1_000_000,
        status: 'PAID_OFF',
        repayments: [{ amount: 900_000 }],
      });

      await service.deleteRepayment('r1', 'c1');

      expect(prisma.fundingSource.update).toHaveBeenCalledWith({
        where: { id: 'cash' },
        data: { currentBalance: 500_000, remainingAmount: 500_000 },
      });
      expect(prisma.bankLoan.update).toHaveBeenCalledWith({
        where: { id: 'loan1' },
        data: { status: 'ACTIVE' },
      });
    });

    it('throws for a repayment belonging to another company', async () => {
      prisma.bankLoanRepayment.findFirst.mockResolvedValue(null);
      await expect(service.deleteRepayment('r1', 'other-company')).rejects.toThrow(NotFoundException);
      expect(prisma.bankLoanRepayment.delete).not.toHaveBeenCalled();
    });
  });
});
