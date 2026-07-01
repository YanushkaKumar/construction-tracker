import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, reporterId: string, data: any) {
    return this.prisma.dailyReport.create({
      data: { ...data, projectId, reporterId, reportDate: new Date(data.reportDate) },
      include: { images: true, reporter: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findByProject(projectId: string, page = 1, limit = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where: { projectId },
        include: { reporter: { select: { id: true, firstName: true, lastName: true } }, images: true },
        orderBy: { reportDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dailyReport.count({ where: { projectId } }),
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

  async findById(id: string) {
    return this.prisma.dailyReport.findUnique({
      where: { id },
      include: { reporter: { select: { id: true, firstName: true, lastName: true } }, images: true },
    });
  }
}
