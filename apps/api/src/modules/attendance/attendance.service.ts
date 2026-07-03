import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markBatch(projectId: string, markedById: string, records: any[]) {
    // Find companyId from project
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      select: { companyId: true }
    });
    if (!project) throw new Error('Project not found');
    const companyId = project.companyId;

    const workerIds = records.map((r) => r.workerId);
    const workersList = await this.prisma.worker.findMany({
      where: { id: { in: workerIds } },
    });
    const rates = new Map(workersList.map((w) => [w.id, Number(w.dailyRate)]));

    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const record of records) {
        const rate = rates.get(record.workerId) || 0;
        const wage = record.dailyWage !== undefined ? Number(record.dailyWage) : rate;

        // Check if attendance already exists
        const existing = await tx.attendance.findUnique({
          where: { workerId_projectId_date: { workerId: record.workerId, projectId, date: new Date(record.date) } },
          include: { fundingAllocations: true }
        });

        if (existing) {
          // Restore old allocations
          for (const fa of existing.fundingAllocations) {
            await tx.fundingSource.update({
              where: { id: fa.fundingSourceId },
              data: {
                currentBalance: { increment: Number(fa.amount) },
                remainingAmount: { increment: Number(fa.amount) },
              }
            });
          }
          await tx.fundingAllocation.deleteMany({ where: { attendanceId: existing.id } });
        }

        const attendance = await tx.attendance.upsert({
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

        // Deduct wage from default Company Cash pool if status is PRESENT or HALF_DAY
        if (wage > 0 && (record.status === 'PRESENT' || record.status === 'HALF_DAY')) {
          const companyCash = await tx.fundingSource.findFirst({
            where: { companyId, type: 'COMPANY_CASH' }
          });
          if (companyCash) {
            await tx.fundingSource.update({
              where: { id: companyCash.id },
              data: {
                currentBalance: { decrement: wage },
                remainingAmount: { decrement: wage },
              }
            });

            await tx.fundingAllocation.create({
              data: {
                fundingSourceId: companyCash.id,
                amount: wage,
                attendanceId: attendance.id,
              }
            });
          }
        }

        results.push(attendance);
      }

      return results;
    });
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
