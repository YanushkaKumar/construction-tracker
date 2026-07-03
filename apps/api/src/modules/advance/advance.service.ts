import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdvanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, companyId: string, receivedById: string, data: any) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      select: { name: true, code: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.$transaction(async (tx) => {
      const advance = await tx.projectAdvance.create({
        data: {
          projectId,
          companyId,
          receivedById,
          amount: data.amount,
          description: data.description,
          referenceNo: data.referenceNo || null,
          receivedDate: new Date(data.receivedDate),
          status: data.status || 'RECEIVED',
          notes: data.notes || null,
          bankLoanId: data.bankLoanId || null,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          receivedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Auto-create corresponding FundingSource
      const amt = Number(data.amount);
      await tx.fundingSource.create({
        data: {
          companyId,
          type: 'PROJECT_ADVANCE',
          name: `${project.code} - Client Advance (${data.referenceNo || 'Milestone'})`,
          openingBalance: amt,
          currentBalance: amt,
          originalAmount: amt,
          remainingAmount: amt,
          projectId,
          projectAdvanceId: advance.id,
        },
      });

      return advance;
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.projectAdvance.findMany({
      where: { projectId },
      include: {
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async findAll(companyId: string, filters?: { projectId?: string; startDate?: string; endDate?: string }) {
    const where: any = { companyId };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.startDate || filters?.endDate) {
      where.receivedDate = {};
      if (filters?.startDate) where.receivedDate.gte = new Date(filters.startDate);
      if (filters?.endDate) where.receivedDate.lte = new Date(filters.endDate);
    }

    return this.prisma.projectAdvance.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async getSummary(companyId: string) {
    const advances = await this.prisma.projectAdvance.groupBy({
      by: ['projectId'],
      where: { companyId, status: { in: ['RECEIVED', 'PARTIAL_RETURN'] } },
      _sum: { amount: true },
      _count: true,
    });

    // Enrich with project names
    const projectIds = advances.map((a: any) => a.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, code: true },
    });
 
    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
 
    return advances.map((a: any) => ({
      projectId: a.projectId,
      project: projectMap[a.projectId] || null,
      totalAdvance: Number(a._sum.amount || 0),
      count: a._count,
    }));
  }

  async update(id: string, companyId: string, data: any) {
    const advance = await this.prisma.projectAdvance.findFirst({
      where: { id, companyId },
    });
    if (!advance) throw new NotFoundException('Advance not found');

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.referenceNo !== undefined) updateData.referenceNo = data.referenceNo;
    if (data.receivedDate !== undefined) updateData.receivedDate = new Date(data.receivedDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.bankLoanId !== undefined) updateData.bankLoanId = data.bankLoanId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectAdvance.update({
        where: { id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true, code: true } },
          receivedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update corresponding FundingSource
      if (data.amount !== undefined) {
        const source = await tx.fundingSource.findFirst({ where: { projectAdvanceId: id } });
        if (source) {
          const amt = Number(data.amount);
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
    const advance = await this.prisma.projectAdvance.findFirst({
      where: { id, companyId },
    });
    if (!advance) throw new NotFoundException('Advance not found');

    return this.prisma.$transaction(async (tx) => {
      // Find and delete the corresponding FundingSource
      const source = await tx.fundingSource.findFirst({ where: { projectAdvanceId: id } });
      if (source) {
        // Prevent deleting if it has active allocations
        const count = await tx.fundingAllocation.count({ where: { fundingSourceId: source.id } });
        if (count > 0) {
          throw new BadRequestException('Cannot delete this project advance as it has been allocated to expenses');
        }
        await tx.fundingSource.delete({ where: { id: source.id } });
      }

      return tx.projectAdvance.delete({ where: { id } });
    });
  }
}
