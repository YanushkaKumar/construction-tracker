import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { assertProjectInCompany } from '../../common/utils/tenant.util';
import { parseAmount } from '../../common/utils/money.util';
import { parseRequiredDate } from '../../common/utils/date-range.util';

/** Trimmed string, or undefined when the caller left it blank. */
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

@Injectable()
export class MaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.material.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  /**
   * Only the fields the material form owns are written. Spreading the request
   * body made every column client-settable, including currentStock.
   */
  async create(companyId: string, data: any) {
    const d = data ?? {};
    const name = text(d.name);
    const unit = text(d.unit);
    if (!name) throw new BadRequestException('Material name is required');
    if (!unit) throw new BadRequestException('Unit is required');

    return this.prisma.material.create({
      data: {
        companyId,
        name,
        unit,
        category: text(d.category),
        description: text(d.description),
        unitPrice: parseAmount(d.unitPrice ?? 0, 'Unit price', { allowZero: true }),
        minimumStock: parseAmount(d.minimumStock ?? 0, 'Minimum stock', { allowZero: true }),
        currentStock: parseAmount(d.currentStock ?? 0, 'Current stock', { allowZero: true }),
      },
    });
  }

  async createRequest(projectId: string, companyId: string, requestedById: string, data: any) {
    await assertProjectInCompany(this.prisma, projectId, companyId);
    const d = data ?? {};
    const materialId = text(d.materialId);
    if (!materialId) throw new BadRequestException('Choose a material for this request');

    const quantity = parseAmount(d.quantity, 'Quantity');
    const unitPrice =
      d.unitPrice === undefined || d.unitPrice === null || d.unitPrice === ''
        ? undefined
        : parseAmount(d.unitPrice, 'Unit price', { allowZero: true });

    return this.prisma.materialRequest.create({
      data: {
        projectId,
        requestedById,
        materialId,
        supplierId: text(d.supplierId) ?? null,
        quantity,
        unitPrice,
        // Derived rather than trusted: a client could otherwise send a total
        // that does not match the quantity and price beside it.
        totalPrice: unitPrice === undefined ? undefined : Math.round(quantity * unitPrice * 100) / 100,
        deliveryDate: d.deliveryDate ? parseRequiredDate(d.deliveryDate, 'Delivery date') : null,
        notes: text(d.notes) ?? null,
      },
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

  async findRequestsByProject(projectId: string, companyId: string) {
    return this.prisma.materialRequest.findMany({
      where: { projectId, project: { companyId } },
      include: {
        material: true,
        supplier: true,
        project: { select: { id: true, name: true, code: true } },
      },
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
    const d = data ?? {};
    const name = text(d.name);
    if (!name) throw new BadRequestException('Supplier name is required');

    return this.prisma.supplier.create({
      data: {
        companyId,
        name,
        contactPerson: text(d.contactPerson) ?? null,
        phone: text(d.phone) ?? null,
        email: text(d.email) ?? null,
        address: text(d.address) ?? null,
        materialTypes: Array.isArray(d.materialTypes) ? d.materialTypes : [],
        rating: Number.isInteger(d.rating) ? d.rating : null,
      },
    });
  }
}
