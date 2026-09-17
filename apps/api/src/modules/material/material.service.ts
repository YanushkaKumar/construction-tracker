import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { assertProjectInCompany } from '../../common/utils/tenant.util';

@Injectable()
export class MaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.material.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async create(companyId: string, data: any) {
    return this.prisma.material.create({ data: { ...data, companyId } });
  }

  async createRequest(projectId: string, companyId: string, requestedById: string, data: any) {
    await assertProjectInCompany(this.prisma, projectId, companyId);
    return this.prisma.materialRequest.create({
      data: { ...data, projectId, requestedById },
      include: { material: true, supplier: true },
    });
  }

  async findRequestsByCompany(companyId: string, status?: string) {
    return this.prisma.materialRequest.findMany({
      where: { project: { companyId }, ...(status ? { status: status as any } : {}) },
      include: {
        material: true,
        supplier: true,
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRequestsByProject(projectId: string) {
    return this.prisma.materialRequest.findMany({
      where: { projectId },
      include: { material: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRequestStatus(id: string, companyId: string, status: string) {
    // updateMany so the company filter is part of the write itself — a plain
    // update() can only be keyed by id and would cross tenants.
    const result = await this.prisma.materialRequest.updateMany({
      where: { id, project: { companyId } },
      data: { status: status as any },
    });
    if (result.count === 0) throw new NotFoundException('Material request not found');
    return this.prisma.materialRequest.findFirst({
      where: { id, project: { companyId } },
      include: { material: true, supplier: true },
    });
  }

  // Supplier methods
  async findSuppliers(companyId: string) {
    return this.prisma.supplier.findMany({ where: { companyId, isActive: true }, orderBy: { name: 'asc' } });
  }

  async createSupplier(companyId: string, data: any) {
    return this.prisma.supplier.create({ data: { ...data, companyId } });
  }
}
