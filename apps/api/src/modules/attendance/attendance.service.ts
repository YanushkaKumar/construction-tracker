import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markBatch(projectId: string, markedById: string, records: any[]) {
    const workerIds = records.map((r) => r.workerId);
    const workersList = await this.prisma.worker.findMany({
      where: { id: { in: workerIds } },
    });
    const rates = new Map(workersList.map((w) => [w.id, Number(w.dailyRate)]));

    const results = await Promise.all(
      records.map((record) => {
        const rate = rates.get(record.workerId) || 0;
        const wage = record.dailyWage !== undefined ? record.dailyWage : rate;

        return this.prisma.attendance.upsert({
          where: { workerId_projectId_date: { workerId: record.workerId, projectId, date: new Date(record.date) } },
          create: {
            workerId: record.workerId,
            projectId,
            date: new Date(record.date),
            status: record.status,
            dailyWage: wage,
            markedById,
            hoursWorked: record.hoursWorked || 8,
            overtimeHours: record.overtimeHours || 0,
          },
          update: {
            status: record.status,
            dailyWage: wage,
            hoursWorked: record.hoursWorked || 8,
            overtimeHours: record.overtimeHours || 0,
          },
        });
      }),
    );
    return results;
  }

  async findByProject(projectId: string, date?: string) {
    return this.prisma.attendance.findMany({
      where: { projectId, ...(date ? { date: new Date(date) } : {}) },
      include: { worker: { select: { id: true, firstName: true, lastName: true, skillType: true, dailyRate: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getPayrollSummary(companyId: string, startDate: string, endDate: string) {
    const attendance = await this.prisma.attendance.findMany({
      where: {
        worker: { companyId },
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: { worker: { select: { id: true, firstName: true, lastName: true, skillType: true } }, project: { select: { id: true, name: true } } },
    });

    // Group by worker and calculate totals
    const workerMap = new Map<string, any>();
    for (const record of attendance) {
      const key = record.workerId;
      if (!workerMap.has(key)) {
        workerMap.set(key, { worker: record.worker, totalDays: 0, totalWage: 0, projects: new Set() });
      }
      const entry = workerMap.get(key)!;
      if (record.status === 'PRESENT') entry.totalDays += 1;
      else if (record.status === 'HALF_DAY') entry.totalDays += 0.5;
      entry.totalWage += Number(record.dailyWage);
      entry.projects.add(record.project.name);
    }

    return Array.from(workerMap.values()).map((e) => ({
      ...e,
      projects: Array.from(e.projects),
    }));
  }
}
