import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdvanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, companyId: string, receivedById: string, data: any) {
    return this.prisma.projectAdvance.create({
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

    return this.prisma.projectAdvance.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, code: true } },
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, companyId: string) {
    const advance = await this.prisma.projectAdvance.findFirst({
      where: { id, companyId },
    });
    if (!advance) throw new NotFoundException('Advance not found');

    return this.prisma.projectAdvance.delete({ where: { id } });
  }
}
