import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { parseAmount } from '../../common/utils/money.util';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.worker.findMany({ where: { companyId, isActive: true }, orderBy: { firstName: 'asc' } });
  }

  /**
   * Only the fields a worker form actually owns are written.
   *
   * This used to spread the request body straight into the create, so any
   * column a caller cared to name — isActive, photo, createdAt — was writable,
   * and a missing firstName surfaced as a bare 500 from inside Prisma instead
   * of saying which field was absent.
   */
  async create(companyId: string, data: any) {
    const fields = this.toWorkerFields(data, true);
    return this.prisma.worker.create({
      data: {
        ...fields,
        firstName: fields.firstName as string,
        lastName: fields.lastName as string,
        companyId,
      },
    });
  }

  private toWorkerFields(data: any, requireNames: boolean) {
    const d = data ?? {};
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

    const firstName = text(d.firstName);
    const lastName = text(d.lastName);
    if (requireNames && !firstName) throw new BadRequestException('First name is required');
    if (requireNames && !lastName) throw new BadRequestException('Last name is required');

    const fields: Record<string, unknown> = {
      firstName,
      lastName,
      nic: text(d.nic),
      phone: text(d.phone),
      address: text(d.address),
      emergencyContact: text(d.emergencyContact),
      skillType: text(d.skillType),
      photo: text(d.photo),
    };
    if (d.dailyRate !== undefined) {
      fields.dailyRate = parseAmount(d.dailyRate, 'Daily rate', { allowZero: true });
    }
    if (typeof d.isActive === 'boolean') fields.isActive = d.isActive;

    for (const key of Object.keys(fields)) {
      if (fields[key] === undefined) delete fields[key];
    }
    return fields;
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

    return this.prisma.worker.update({
      where: { id },
      data: this.toWorkerFields(data, false),
    });
  }
}
