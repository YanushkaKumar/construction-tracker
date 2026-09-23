import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseAmount } from '../../common/utils/money.util';
import { creditMainAccount, debitMainAccount } from '../../common/utils/main-account.util';
import { BankLoanStatus } from '@prisma/client';

@Injectable()
export class BankLoanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.bankLoan.create({
        data: {
          companyId,
          bankName: data.bankName,
          loanAmount: data.loanAmount,
          interestRate: data.interestRate,
          receivedDate: new Date(data.receivedDate),
          status: data.status || BankLoanStatus.ACTIVE,
          notes: data.notes,
        },
      });

      const amt = parseAmount(data.loanAmount, 'Loan amount');
      await tx.fundingSource.create({
        data: {
          companyId,
          type: 'BANK_LOAN',
          name: `${data.bankName} - Loan Facility`,
          openingBalance: amt,
          // Provenance only — the drawdown lands in the Main Account.
          currentBalance: 0,
          originalAmount: amt,
          remainingAmount: 0,
          bankLoanId: loan.id,
        },
      });
      await creditMainAccount(tx, companyId, amt);

      return loan;
    });
  }

  async findAll(companyId: string) {
    const loans = await this.prisma.bankLoan.findMany({
      where: { companyId },
      include: {
        advances: {
          select: { amount: true }
        },
        purchases: {
          select: { totalAmount: true }
        },
        repayments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            referenceNo: true,
            notes: true,
          }
        }
      },
      orderBy: { receivedDate: 'desc' },
    });

    // Calculate spent, repaid, balance, and outstandingDebt for each loan
    return loans.map(loan => {
      const spentAdvances = loan.advances.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const spentPurchases = loan.purchases.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
      const spent = spentAdvances + spentPurchases;
      const repaid = loan.repayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      const balance = Number(loan.loanAmount) - spent;
      const outstandingDebt = Number(loan.loanAmount) - repaid;

      return {
        ...loan,
        loanAmount: Number(loan.loanAmount),
        interestRate: Number(loan.interestRate),
        spentAdvances,
        spentPurchases,
        spent,
        repaid,
        repaidAmount: repaid,
        balance,
        outstandingDebt,
      };
    });
  }

  async findOne(id: string, companyId: string) {
    const loan = await this.prisma.bankLoan.findFirst({
      where: { id, companyId },
      include: {
        advances: {
          include: { project: true }
        },
        purchases: {
          include: {
            allocations: {
              include: { project: true }
            }
          }
        },
        repayments: true
      }
    });

    if (!loan) throw new NotFoundException('Bank loan not found');

    const spentAdvances = loan.advances.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const spentPurchases = loan.purchases.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
    const spent = spentAdvances + spentPurchases;
    const repaid = loan.repayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const balance = Number(loan.loanAmount) - spent;
    const outstandingDebt = Number(loan.loanAmount) - repaid;

    return {
      ...loan,
      loanAmount: Number(loan.loanAmount),
      interestRate: Number(loan.interestRate),
      spentAdvances,
      spentPurchases,
      spent,
      repaid,
      repaidAmount: repaid,
      balance,
      outstandingDebt,
    };
  }

  async update(id: string, companyId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.bankLoan.findFirst({ where: { id, companyId } });
      if (!loan) throw new NotFoundException('Bank loan not found');

      const updated = await tx.bankLoan.update({
        where: { id, companyId },
        data,
      });

      if (data.loanAmount !== undefined) {
        const source = await tx.fundingSource.findFirst({ where: { bankLoanId: id } });
        if (source) {
          const amt = parseAmount(data.loanAmount, 'Loan amount');
          const difference = amt - Number(source.originalAmount);
          await tx.fundingSource.update({
            where: { id: source.id },
            data: { originalAmount: amt, openingBalance: amt },
          });
          if (difference > 0) {
            await creditMainAccount(tx, companyId, difference);
          } else if (difference < 0) {
            await debitMainAccount(tx, companyId, -difference, 'loan correction');
          }
        }
      }

      return updated;
    });
  }

  async delete(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.bankLoan.findFirst({
        where: { id, companyId },
        select: { id: true, loanAmount: true },
      });
      if (!loan) throw new NotFoundException('Bank loan not found');

      // Deleting a loan undoes both sides of it: the drawdown that credited
      // the Main Account, and every repayment that was taken out of it. The
      // repayment rows go with the loan, so their money has to come back.
      const repaid = await tx.bankLoanRepayment.aggregate({
        where: { bankLoanId: id },
        _sum: { amount: true },
      });
      const repaidTotal = Number(repaid._sum.amount || 0);
      if (repaidTotal > 0) {
        await creditMainAccount(tx, companyId, repaidTotal);
      }

      const drawn = Number(loan.loanAmount);
      if (drawn > 0) {
        await debitMainAccount(tx, companyId, drawn, 'loan removal');
      }

      const source = await tx.fundingSource.findFirst({ where: { bankLoanId: id } });
      if (source) {
        await tx.fundingSource.delete({ where: { id: source.id } });
      }

      return tx.bankLoan.delete({ where: { id } });
    });
  }

  async createRepayment(loanId: string, companyId: string, data: any) {
    const loan = await this.prisma.bankLoan.findFirst({
      where: { id: loanId, companyId }
    });
    if (!loan) throw new NotFoundException('Bank loan not found');

    const totalRepaidResult = await this.prisma.bankLoanRepayment.aggregate({
      where: { bankLoanId: loanId },
      _sum: { amount: true }
    });
    const currentRepaid = Number(totalRepaidResult._sum.amount || 0);
    const outstanding = Number(loan.loanAmount) - currentRepaid;
    const repaymentAmount = parseAmount(data.amount, 'Repayment amount');

    if (repaymentAmount > outstanding + 0.01) {
      throw new BadRequestException(
        `Repayment amount (LKR ${repaymentAmount.toLocaleString()}) exceeds the outstanding balance (LKR ${outstanding.toLocaleString()})`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Repaying a loan is money leaving the company, so it comes off the one
      // balance. This used to pick "the first COMPANY_CASH source" and, when
      // there wasn't one, record the repayment and deduct nothing at all.
      await debitMainAccount(tx, companyId, repaymentAmount, 'loan repayment');

      const repayment = await tx.bankLoanRepayment.create({
        data: {
          bankLoanId: loanId,
          amount: data.amount,
          paymentDate: new Date(data.paymentDate),
          referenceNo: data.referenceNo || null,
          notes: data.notes || null,
        }
      });

      const newTotalRepaid = currentRepaid + repaymentAmount;
      if (newTotalRepaid >= Number(loan.loanAmount) - 0.01) {
        await tx.bankLoan.update({
          where: { id: loanId },
          data: { status: 'PAID_OFF' }
        });
      }

      return repayment;
    });
  }

  async deleteRepayment(repaymentId: string, companyId: string) {
    const repayment = await this.prisma.bankLoanRepayment.findFirst({
      where: {
        id: repaymentId,
        bankLoan: { companyId }
      }
    });
    if (!repayment) throw new NotFoundException('Repayment not found');

    return this.prisma.$transaction(async (tx) => {
      const deletedRepayment = await tx.bankLoanRepayment.delete({
        where: { id: repaymentId }
      });

      // Undoing a repayment puts the money back on the company balance.
      await creditMainAccount(tx, companyId, Number(deletedRepayment.amount));

      const loan = await tx.bankLoan.findUnique({
        where: { id: deletedRepayment.bankLoanId },
        include: { repayments: { select: { amount: true } } }
      });

      if (loan) {
        const totalRepaid = loan.repayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (totalRepaid < Number(loan.loanAmount) - 0.01 && loan.status === 'PAID_OFF') {
          await tx.bankLoan.update({
            where: { id: loan.id },
            data: { status: 'ACTIVE' }
          });
        }
      }

      return deletedRepayment;
    });
  }
}
