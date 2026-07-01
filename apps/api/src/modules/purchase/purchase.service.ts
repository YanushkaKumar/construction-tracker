import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, purchasedById: string, data: any) {
    const { allocations, ...purchaseData } = data;

    // Validate allocations sum to totalAmount
    if (allocations && allocations.length > 0) {
      const totalAllocated = allocations.reduce(
        (sum: number, a: any) => sum + Number(a.amount),
        0,
      );
      const totalAmount = Number(purchaseData.totalAmount);
      if (Math.abs(totalAllocated - totalAmount) > 0.01) {
        throw new BadRequestException(
          `Allocation total (${totalAllocated}) does not match purchase total (${totalAmount})`,
        );
      }
    }

    return this.prisma.purchase.create({
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
                percentage: a.percentage || ((Number(a.amount) / Number(purchaseData.totalAmount)) * 100),
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
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.purchase.findMany({
      where: {
        allocations: { some: { projectId } },
      },
      include: {
        purchasedBy: { select: { id: true, firstName: true, lastName: true } },
        allocations: {
          include: {
            project: { select: { id: true, name: true, code: true } },
          },
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
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async update(id: string, companyId: string, data: any) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    const { allocations, ...purchaseData } = data;

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

    // If allocations are provided, replace them all
    if (allocations) {
      const totalAmount = Number(purchaseData.totalAmount || existing.totalAmount);
      const totalAllocated = allocations.reduce(
        (sum: number, a: any) => sum + Number(a.amount),
        0,
      );
      if (Math.abs(totalAllocated - totalAmount) > 0.01) {
        throw new BadRequestException(
          `Allocation total (${totalAllocated}) does not match purchase total (${totalAmount})`,
        );
      }

      // Delete old and create new allocations in a transaction
      return this.prisma.$transaction(async (tx) => {
        await tx.purchaseAllocation.deleteMany({ where: { purchaseId: id } });
        return tx.purchase.update({
          where: { id },
          data: {
            ...updateData,
            allocations: {
              create: allocations.map((a: any) => ({
                projectId: a.projectId,
                amount: a.amount,
                percentage: a.percentage || ((Number(a.amount) / totalAmount) * 100),
                notes: a.notes || null,
              })),
            },
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
      });
    }

    return this.prisma.purchase.update({
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
  }

  async delete(id: string, companyId: string) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    return this.prisma.purchase.delete({ where: { id } });
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
