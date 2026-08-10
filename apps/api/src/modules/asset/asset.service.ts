import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const purchasePrice = Number(data.purchasePrice || 0);
    const rawAllocations = data.fundingAllocations || [];

    return this.prisma.$transaction(async (tx) => {
      // If allocations are provided, process them
      let allocationsToProcess = rawAllocations;
      if (purchasePrice > 0 && allocationsToProcess.length === 0) {
        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        allocationsToProcess = [{ fundingSourceId: companyCash.id, amount: purchasePrice }];
      }

      // Validate allocations sum
      if (allocationsToProcess.length > 0) {
        const allocationsSum = allocationsToProcess.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
        if (Math.abs(allocationsSum - purchasePrice) > 0.01) {
          throw new BadRequestException(`Allocated funds (LKR ${allocationsSum.toLocaleString()}) must match asset purchase price (LKR ${purchasePrice.toLocaleString()})`);
        }

        // Deduct balances
        for (const alloc of allocationsToProcess) {
          const source = await tx.fundingSource.findFirst({ where: { id: alloc.fundingSourceId, companyId } });
          if (!source) throw new NotFoundException(`Funding source ${alloc.fundingSourceId} not found`);
          if (Number(source.currentBalance) < Number(alloc.amount)) {
            throw new BadRequestException(`Insufficient balance in funding source "${source.name}". Required: LKR ${Number(alloc.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`);
          }

          await tx.fundingSource.update({
            where: { id: source.id },
            data: {
              currentBalance: Number(source.currentBalance) - Number(alloc.amount),
              remainingAmount: Number(source.remainingAmount) - Number(alloc.amount),
            }
          });
        }
      }

      const asset = await tx.asset.create({
        data: {
          companyId,
          name: data.name,
          category: data.category,
          purchasePrice: data.purchasePrice || 0,
          condition: data.condition || 'NEW',
          currentProjectId: data.currentProjectId || null,
          purchaseId: data.purchaseId || null,
          serialNumber: data.serialNumber || null,
          notes: data.notes || null,
        },
        include: {
          currentProject: { select: { id: true, name: true, code: true } },
          purchase: { select: { id: true, title: true, totalAmount: true } },
        },
      });

      // Save allocations
      for (const alloc of allocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: alloc.fundingSourceId,
            amount: alloc.amount,
            assetId: asset.id,
          }
        });
      }

      return asset;
    });
  }

  async findAll(companyId: string, filters?: { category?: string; condition?: string; projectId?: string }) {
    const where: any = { companyId };
    if (filters?.category) where.category = filters.category;
    if (filters?.condition) where.condition = filters.condition;
    if (filters?.projectId) where.currentProjectId = filters.projectId;

    return this.prisma.asset.findMany({
      where,
      include: {
        currentProject: { select: { id: true, name: true, code: true } },
        purchase: { select: { id: true, title: true, totalAmount: true, purchaseDate: true } },
        fundingAllocations: { include: { fundingSource: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, companyId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId },
      include: {
        currentProject: { select: { id: true, name: true, code: true } },
        purchase: { select: { id: true, title: true, totalAmount: true, purchaseDate: true } },
        fundingAllocations: { include: { fundingSource: true } },
        assignments: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            assignedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async assign(id: string, companyId: string, assignedById: string, data: any) {
    const asset = await this.prisma.asset.findFirst({ where: { id, companyId } });
    if (!asset) throw new NotFoundException('Asset not found');

    // Close any current open assignment
    return this.prisma.$transaction(async (tx) => {
      // End current assignment if there is one
      if (asset.currentProjectId) {
        await tx.assetAssignment.updateMany({
          where: { assetId: id, endDate: null },
          data: { endDate: new Date(data.startDate || new Date()) },
        });
      }

      // Create new assignment
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: id,
          projectId: data.projectId,
          assignedById,
          startDate: new Date(data.startDate || new Date()),
          notes: data.notes || null,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          assignedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update current project on asset
      await tx.asset.update({
        where: { id },
        data: { currentProjectId: data.projectId },
      });

      return assignment;
    });
  }

  async returnAsset(id: string, companyId: string, data?: any) {
    const asset = await this.prisma.asset.findFirst({ where: { id, companyId } });
    if (!asset) throw new NotFoundException('Asset not found');
    if (!asset.currentProjectId) throw new BadRequestException('Asset is not assigned to any project');

    return this.prisma.$transaction(async (tx) => {
      // Close current assignment
      await tx.assetAssignment.updateMany({
        where: { assetId: id, endDate: null },
        data: { endDate: new Date() },
      });

      // Clear current project
      return tx.asset.update({
        where: { id },
        data: {
          currentProjectId: null,
          condition: data?.condition || asset.condition,
        },
        include: {
          currentProject: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  async getHistory(id: string, companyId: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id, companyId } });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.assetAssignment.findMany({
      where: { assetId: id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(id: string, companyId: string, data: any) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId },
      include: { fundingAllocations: true }
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore old funding allocations
      for (const fa of asset.fundingAllocations) {
        await tx.fundingSource.update({
          where: { id: fa.fundingSourceId },
          data: {
            currentBalance: { increment: Number(fa.amount) },
            remainingAmount: { increment: Number(fa.amount) },
          },
        });
      }
      await tx.fundingAllocation.deleteMany({ where: { assetId: id } });

      // 2. Validate and deduct new allocations
      const purchasePrice = data.purchasePrice !== undefined ? Number(data.purchasePrice) : Number(asset.purchasePrice);
      const rawAllocations = data.fundingAllocations || [];

      let allocationsToProcess = rawAllocations;
      if (purchasePrice > 0 && allocationsToProcess.length === 0) {
        const companyCash = await tx.fundingSource.findFirst({
          where: { companyId, type: 'COMPANY_CASH' }
        });
        if (!companyCash) throw new NotFoundException('Default company cash funding source not found');
        allocationsToProcess = [{ fundingSourceId: companyCash.id, amount: purchasePrice }];
      }

      if (allocationsToProcess.length > 0) {
        const allocationsSum = allocationsToProcess.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
        if (Math.abs(allocationsSum - purchasePrice) > 0.01) {
          throw new BadRequestException(`Allocated funds (LKR ${allocationsSum.toLocaleString()}) must match asset purchase price (LKR ${purchasePrice.toLocaleString()})`);
        }

        for (const alloc of allocationsToProcess) {
          const source = await tx.fundingSource.findFirst({ where: { id: alloc.fundingSourceId, companyId } });
          if (!source) throw new NotFoundException(`Funding source ${alloc.fundingSourceId} not found`);
          if (Number(source.currentBalance) < Number(alloc.amount)) {
            throw new BadRequestException(`Insufficient balance in funding source "${source.name}". Required: LKR ${Number(alloc.amount).toLocaleString()}, Available: LKR ${Number(source.currentBalance).toLocaleString()}`);
          }

          await tx.fundingSource.update({
            where: { id: source.id },
            data: {
              currentBalance: Number(source.currentBalance) - Number(alloc.amount),
              remainingAmount: Number(source.remainingAmount) - Number(alloc.amount),
            }
          });
        }
      }

      // 3. Save new allocations
      for (const alloc of allocationsToProcess) {
        await tx.fundingAllocation.create({
          data: {
            fundingSourceId: alloc.fundingSourceId,
            amount: alloc.amount,
            assetId: id,
          }
        });
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.condition !== undefined) updateData.condition = data.condition;
      if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;

      return tx.asset.update({
        where: { id },
        data: updateData,
        include: {
          currentProject: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  async delete(id: string, companyId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId },
      include: { fundingAllocations: true }
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.$transaction(async (tx) => {
      // Restore funding source balances
      for (const fa of asset.fundingAllocations) {
        await tx.fundingSource.update({
          where: { id: fa.fundingSourceId },
          data: {
            currentBalance: { increment: Number(fa.amount) },
            remainingAmount: { increment: Number(fa.amount) },
          },
        });
      }

      return tx.asset.delete({ where: { id } });
    });
  }
}
