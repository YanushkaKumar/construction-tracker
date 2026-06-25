import { Injectable } from '@nestjs/common';
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

  async findById(id: string) {
    return this.prisma.worker.findUnique({ where: { id }, include: { attendance: { orderBy: { date: 'desc' }, take: 30 } } });
  }

  async update(id: string, data: any) {
    return this.prisma.worker.update({ where: { id }, data });
  }
}
