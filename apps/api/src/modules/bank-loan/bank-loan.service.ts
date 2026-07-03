import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
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

      const amt = Number(data.loanAmount);
      await tx.fundingSource.create({
        data: {
          companyId,
          type: 'BANK_LOAN',
          name: `${data.bankName} - Loan Facility`,
          openingBalance: amt,
          currentBalance: amt,
          originalAmount: amt,
          remainingAmount: amt,
          bankLoanId: loan.id,
        },
      });

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
          const amt = Number(data.loanAmount);
          const difference = amt - Number(source.originalAmount);
          await tx.fundingSource.update({
            where: { id: source.id },
            data: {
              originalAmount: amt,
              openingBalance: amt,
              currentBalance: Number(source.currentBalance) + difference,
              remainingAmount: Number(source.remainingAmount) + difference,
            },
          });
        }
      }

      return updated;
    });
  }

  async delete(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.fundingSource.findFirst({ where: { bankLoanId: id } });
      if (source) {
        const count = await tx.fundingAllocation.count({ where: { fundingSourceId: source.id } });
        if (count > 0) {
          throw new BadRequestException('Cannot delete this bank loan as its funds have already been allocated to expenses');
        }
        await tx.fundingSource.delete({ where: { id: source.id } });
      }

      return tx.bankLoan.delete({
        where: { id, companyId },
      });
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
    const repaymentAmount = Number(data.amount);

    if (repaymentAmount > outstanding + 0.01) {
      throw new BadRequestException(
        `Repayment amount (LKR ${repaymentAmount.toLocaleString()}) exceeds the outstanding balance (LKR ${outstanding.toLocaleString()})`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Find the first Company Cash funding source to deduct repayment from
      const companyCash = await tx.fundingSource.findFirst({
        where: { companyId, type: 'COMPANY_CASH' }
      });
      if (companyCash) {
        if (Number(companyCash.currentBalance) < repaymentAmount) {
          throw new BadRequestException('Insufficient Company Cash to perform loan repayment');
        }
        await tx.fundingSource.update({
          where: { id: companyCash.id },
          data: {
            currentBalance: Number(companyCash.currentBalance) - repaymentAmount,
            remainingAmount: Number(companyCash.remainingAmount) - repaymentAmount,
          }
        });
      }

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

      // Restore repayment amount to Company Cash
      const companyCash = await tx.fundingSource.findFirst({
        where: { companyId, type: 'COMPANY_CASH' }
      });
      if (companyCash) {
        await tx.fundingSource.update({
          where: { id: companyCash.id },
          data: {
            currentBalance: Number(companyCash.currentBalance) + Number(deletedRepayment.amount),
            remainingAmount: Number(companyCash.remainingAmount) + Number(deletedRepayment.amount),
          }
        });
      }

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
