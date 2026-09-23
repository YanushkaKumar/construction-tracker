import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { assertProjectInCompany } from '../../common/utils/tenant.util';
import { parseRequiredDate } from '../../common/utils/date-range.util';

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, companyId: string, reporterId: string, data: any) {
    await assertProjectInCompany(this.prisma, projectId, companyId);
    const d = data ?? {};
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const workSummary = text(d.workSummary);
    if (!workSummary) throw new BadRequestException('Describe the work done today');

    const wholeNumber = (v: unknown, label: string, max?: number) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || (max !== undefined && n > max)) {
        throw new BadRequestException(`${label} must be a number between 0 and ${max ?? 'any'}`);
      }
      return Math.round(n);
    };

    // Only the fields the daily log form owns are written. Spreading the
    // request body let a caller set any column on the report.
    return this.prisma.dailyReport.create({
      data: {
        projectId,
        reporterId,
        reportDate: parseRequiredDate(d.reportDate, 'Report date'),
        workSummary,
        weatherCondition: text(d.weatherCondition),
        issues: text(d.issues),
        safetyNotes: text(d.safetyNotes),
        notes: text(d.notes),
        workersOnSite: wholeNumber(d.workersOnSite, 'Workers on site') ?? 0,
        progressPercent: wholeNumber(d.progressPercent, 'Progress percent', 100),
      },
      include: { images: true, reporter: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async update(id: string, companyId: string, data: any) {
    const existing = await this.prisma.dailyReport.findFirst({
      where: { id, project: { companyId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Daily report not found');

    const d = data ?? {};
    const text = (v: unknown) => (typeof v === 'string' ? (v.trim() || null) : undefined);
    const fields: Record<string, unknown> = {
      weatherCondition: text(d.weatherCondition),
      issues: text(d.issues),
      safetyNotes: text(d.safetyNotes),
      notes: text(d.notes),
    };

    if (d.workSummary !== undefined) {
      const ws = typeof d.workSummary === 'string' ? d.workSummary.trim() : '';
      if (!ws) throw new BadRequestException('Describe the work done today');
      fields.workSummary = ws;
    }
    if (d.reportDate !== undefined) {
      fields.reportDate = parseRequiredDate(d.reportDate, 'Report date');
    }
    for (const [key, label, max] of [
      ['workersOnSite', 'Workers on site', undefined],
      ['progressPercent', 'Progress percent', 100],
    ] as const) {
      if (d[key] === undefined) continue;
      const n = Number(d[key]);
      if (!Number.isFinite(n) || n < 0 || (max !== undefined && n > max)) {
        throw new BadRequestException(`${label} must be a number between 0 and ${max ?? 'any'}`);
      }
      fields[key] = Math.round(n);
    }
    for (const k of Object.keys(fields)) if (fields[k] === undefined) delete fields[k];

    return this.prisma.dailyReport.update({
      where: { id },
      data: fields,
      include: { images: true, reporter: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async delete(id: string, companyId: string) {
    const existing = await this.prisma.dailyReport.findFirst({
      where: { id, project: { companyId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Daily report not found');

    await this.prisma.dailyReport.delete({ where: { id } });
    return { id, deleted: true };
  }

  async findByProject(projectId: string, companyId: string, page = 1, limit = 20) {
    const where = { projectId, project: { companyId } };
    const [reports, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        include: { reporter: { select: { id: true, firstName: true, lastName: true } }, images: true },
        orderBy: { reportDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dailyReport.count({ where }),
    ]);
    return { data: reports, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByCompany(companyId: string, page = 1, limit = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where: { project: { companyId } },
        include: { 
          reporter: { select: { id: true, firstName: true, lastName: true } }, 
          images: true,
          project: { select: { id: true, name: true, code: true } }
        },
        orderBy: { reportDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dailyReport.count({ where: { project: { companyId } } }),
    ]);
    return { data: reports, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, companyId: string) {
    const report = await this.prisma.dailyReport.findFirst({
      where: { id, project: { companyId } },
      include: { reporter: { select: { id: true, firstName: true, lastName: true } }, images: true },
    });
    // Without this the company-scoped miss returns 200 with a null body
    // instead of a 404.
    if (!report) throw new NotFoundException('Daily report not found');
    return report;
  }
}
