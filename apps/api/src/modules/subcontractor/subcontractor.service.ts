import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SubcontractorService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Subcontractors ────────────────────────

  async create(companyId: string, data: any) {
    return this.prisma.subcontractor.create({
      data: {
        companyId,
        name: data.name,
        specialization: data.specialization,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.subcontractor.findMany({
      where: { companyId },
      include: {
        contracts: {
          select: {
            id: true,
            workScope: true,
            contractAmount: true,
            paidAmount: true,
            status: true,
            project: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { contracts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const sub = await this.prisma.subcontractor.findFirst({
      where: { id, companyId },
      include: {
        contracts: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            payments: { orderBy: { payDate: 'desc' } },
          },
        },
      },
    });
    if (!sub) throw new NotFoundException('Subcontractor not found');
    return sub;
  }

  async update(id: string, companyId: string, data: any) {
    // Check first: a bare update on a missing/foreign row throws Prisma's P2025,
    // which escapes as an opaque 500 instead of a 404.
    const existing = await this.prisma.subcontractor.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Subcontractor not found');

    const { companyId: _ignored, ...safe } = data ?? {};
    return this.prisma.subcontractor.update({ where: { id }, data: safe });
  }

  async delete(id: string, companyId: string) {
    const existing = await this.prisma.subcontractor.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Subcontractor not found');

    return this.prisma.subcontractor.delete({ where: { id } });
  }

  // ── Contracts ─────────────────────────────

  async createContract(companyId: string, data: any) {
    return this.prisma.subcontractorContract.create({
      data: {
        projectId: data.projectId,
        subcontractorId: data.subcontractorId,
        workScope: data.workScope,
        contractAmount: data.contractAmount,
        retentionPercent: data.retentionPercent || 5,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'DRAFT',
        notes: data.notes,
      },
      include: {
        subcontractor: { select: { id: true, name: true, specialization: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async getContracts(companyId: string, projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    // Scope to company through subcontractor
    where.subcontractor = { companyId };

    return this.prisma.subcontractorContract.findMany({
      where,
      include: {
        subcontractor: { select: { id: true, name: true, specialization: true } },
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateContract(id: string, companyId: string, data: any) {
    // Contracts have no companyId; scope through the owning subcontractor.
    const existing = await this.prisma.subcontractorContract.findFirst({
      where: { id, subcontractor: { companyId } },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    return this.prisma.subcontractorContract.update({ where: { id }, data });
  }

  // ── Payments ──────────────────────────────

  async createPayment(contractId: string, data: any) {
    const payment = await this.prisma.subcontractorPayment.create({
      data: {
        contractId,
        amount: data.amount,
        payDate: new Date(data.payDate),
        reference: data.reference,
        notes: data.notes,
      },
    });

    // Update paid amount on contract
    await this.prisma.subcontractorContract.update({
      where: { id: contractId },
      data: { paidAmount: { increment: data.amount } },
    });

    return payment;
  }

  async getPayments(contractId: string) {
    return this.prisma.subcontractorPayment.findMany({
      where: { contractId },
      orderBy: { payDate: 'desc' },
    });
  }
}
