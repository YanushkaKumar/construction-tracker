import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Move a purchase through the procurement lifecycle
   */
  async advanceWorkflowStage(purchaseId: string, companyId: string, requestedStage: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId, companyId },
    });

    if (!purchase) throw new NotFoundException('Purchase not found');

    const stages = ['REQUEST', 'APPROVAL', 'PO_GENERATED', 'GOODS_RECEIVED', 'INVOICED', 'BILLED', 'COMPLETED'];
    const currentIndex = stages.indexOf(purchase.workflowStage);
    const requestedIndex = stages.indexOf(requestedStage);

    if (requestedIndex === -1) {
      throw new BadRequestException('Invalid workflow stage');
    }

    if (requestedIndex < currentIndex) {
      throw new BadRequestException('Cannot move procurement workflow backwards');
    }

    // specific stage logic
    const updateData: any = { workflowStage: requestedStage as any };

    if (requestedStage === 'APPROVAL') {
      updateData.approvedById = userId;
    }

    if (requestedStage === 'BILLED') {
      // Create pending payment obligations if necessary
      updateData.status = 'PENDING';
    }

    if (requestedStage === 'COMPLETED') {
      if (Number(purchase.paidAmount) < Number(purchase.totalAmount)) {
        throw new BadRequestException('Cannot complete workflow until fully paid');
      }
      updateData.status = 'PAID';
    }

    const updated = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: updateData,
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'UPDATE_PROCUREMENT_STAGE',
        entityType: 'PURCHASE',
        entityId: purchaseId,
        changes: { oldStage: purchase.workflowStage, newStage: requestedStage },
      },
    });

    return updated;
  }

  /**
   * Process a payment for a Bill and deduct from Project Wallet
   */
  async processPayment(purchaseId: string, companyId: string, amount: number, paymentMethod: string, walletId: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId, companyId },
      include: { projectWallet: true },
    });

    if (!purchase) throw new NotFoundException('Purchase not found');

    const wallet = await this.prisma.projectWallet.findUnique({
      where: { id: walletId, companyId },
    });

    if (!wallet) throw new NotFoundException('Project Wallet not found');

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient funds in Project Wallet');
    }

    // Process payment Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          companyId,
          amount,
          paymentMethod,
          paidDate: new Date(),
          purchaseId: purchase.id,
          projectWalletId: wallet.id,
        },
      });

      // 2. Deduct from wallet
      await tx.projectWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      });

      // 3. Update Purchase paid amount
      const newPaidAmount = Number(purchase.paidAmount) + amount;
      let newStatus = purchase.status;
      if (newPaidAmount >= Number(purchase.totalAmount)) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      return payment;
    });

    // Log audit outside transaction to prevent rollback issues if it fails
    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'PROCESS_PAYMENT',
        entityType: 'PAYMENT',
        entityId: result.id,
        changes: { amount, purchaseId, walletId },
      },
    });

    return result;
  }
}
