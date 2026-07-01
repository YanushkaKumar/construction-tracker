import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BankLoanStatus } from '@prisma/client';

@Injectable()
export class BankLoanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.bankLoan.create({
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
          select: { amount: true }
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
        balance,
        outstandingDebt
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
      balance,
      outstandingDebt
    };
  }

  async update(id: string, companyId: string, data: any) {
    return this.prisma.bankLoan.update({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return this.prisma.bankLoan.delete({
      where: { id, companyId },
    });
  }

  async createRepayment(loanId: string, companyId: string, data: any) {
    const loan = await this.prisma.bankLoan.findFirst({
      where: { id: loanId, companyId }
    });
    if (!loan) throw new NotFoundException('Bank loan not found');

    return this.prisma.bankLoanRepayment.create({
      data: {
        bankLoanId: loanId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
      }
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

    return this.prisma.bankLoanRepayment.delete({
      where: { id: repaymentId }
    });
  }
}
