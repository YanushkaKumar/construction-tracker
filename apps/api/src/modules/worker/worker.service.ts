import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.worker.findMany({ where: { companyId, isActive: true }, orderBy: { firstName: 'asc' } });
  }

  async create(companyId: string, data: any) {
    return this.prisma.worker.create({ data: { ...data, companyId } });
  }

  async findById(id: string, companyId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, companyId },
      include: { attendance: { orderBy: { date: 'desc' }, take: 30 } },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async update(id: string, companyId: string, data: any) {
    const existing = await this.prisma.worker.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Worker not found');

    // companyId is never client-settable — it would move the worker between tenants.
    const { companyId: _ignored, ...safe } = data ?? {};
    return this.prisma.worker.update({ where: { id }, data: safe });
  }
}
