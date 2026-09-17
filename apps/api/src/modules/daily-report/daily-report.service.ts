import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { assertProjectInCompany } from '../../common/utils/tenant.util';

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, companyId: string, reporterId: string, data: any) {
    await assertProjectInCompany(this.prisma, projectId, companyId);
    return this.prisma.dailyReport.create({
      data: { ...data, projectId, reporterId, reportDate: new Date(data.reportDate) },
      include: { images: true, reporter: { select: { id: true, firstName: true, lastName: true } } },
    });
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
