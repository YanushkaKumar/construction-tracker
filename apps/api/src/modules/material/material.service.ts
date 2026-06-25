import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.material.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async create(companyId: string, data: any) {
    return this.prisma.material.create({ data: { ...data, companyId } });
  }

  async createRequest(projectId: string, requestedById: string, data: any) {
    return this.prisma.materialRequest.create({
      data: { ...data, projectId, requestedById },
      include: { material: true, supplier: true },
    });
  }

  async findRequestsByProject(projectId: string) {
    return this.prisma.materialRequest.findMany({
      where: { projectId },
      include: { material: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRequestStatus(id: string, status: string) {
    return this.prisma.materialRequest.update({ where: { id }, data: { status: status as any } });
  }

  // Supplier methods
  async findSuppliers(companyId: string) {
    return this.prisma.supplier.findMany({ where: { companyId, isActive: true }, orderBy: { name: 'asc' } });
  }

  async createSupplier(companyId: string, data: any) {
    return this.prisma.supplier.create({ data: { ...data, companyId } });
  }
}
