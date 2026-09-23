import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseRequiredDateRange, parseRequiredDate } from '../../common/utils/date-range.util';
import { assertProjectInCompany } from '../../common/utils/tenant.util';
import { parseAmount } from '../../common/utils/money.util';
import { creditMainAccount, debitMainAccount } from '../../common/utils/main-account.util';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markBatch(projectId: string, companyId: string, markedById: string, records: any[]) {
    // companyId comes from the caller's token; this confirms the project is
    // actually theirs rather than reading the owner off the project itself.
    await assertProjectInCompany(this.prisma, projectId, companyId);

    const workerIds = records.map((r) => r.workerId);
    const workersList = await this.prisma.worker.findMany({
      where: { id: { in: workerIds }, companyId },
    });
    const rates = new Map(workersList.map((w) => [w.id, Number(w.dailyRate)]));

    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const record of records) {
        // A missing or unparseable date reached Prisma as an Invalid Date and
        // came back as a bare 500 naming nothing.
        const recordDate = parseRequiredDate(record.date, 'Attendance date');
        const rate = rates.get(record.workerId) || 0;
        const base = record.dailyWage !== undefined ? Number(record.dailyWage) : rate;
        // Extra pay is added on top of the day rate and is what actually gets
        // disbursed, so it has to be part of the amount drawn from funding.
        const extraAmount =
          record.extraAmount !== undefined && record.extraAmount !== null && record.extraAmount !== ''
            ? parseAmount(record.extraAmount, 'Extra pay', { allowZero: true })
            : 0;
        const wage = base + extraAmount;

        // Check if attendance already exists
        const existing = await tx.attendance.findUnique({
          where: { workerId_projectId_date: { workerId: record.workerId, projectId, date: recordDate } },
          include: { fundingAllocations: true }
        });

        if (existing) {
          // Re-marking a day refunds what was already paid for it.
          for (const fa of existing.fundingAllocations) {
            await creditMainAccount(tx, companyId, Number(fa.amount));
          }
          await tx.fundingAllocation.deleteMany({ where: { attendanceId: existing.id } });
        }

        const attendance = await tx.attendance.upsert({
          where: { workerId_projectId_date: { workerId: record.workerId, projectId, date: recordDate } },
          create: {
            workerId: record.workerId,
            projectId,
            date: recordDate,
            status: record.status,
            dailyWage: wage,
            extraAmount,
            markedById,
            hoursWorked: record.hoursWorked || 8,
            overtimeHours: record.overtimeHours || 0,
          },
          update: {
            status: record.status,
            dailyWage: wage,
            extraAmount,
            hoursWorked: record.hoursWorked || 8,
            overtimeHours: record.overtimeHours || 0,
          },
        });

        // Wages come out of the one company balance. This used to look for a
        // COMPANY_CASH pool and, when none existed, skip the deduction
        // entirely — the attendance was recorded and the money was never
        // taken, so payroll and the cash balance quietly disagreed.
        if (wage > 0 && (record.status === 'PRESENT' || record.status === 'HALF_DAY')) {
          const mainAccount = await debitMainAccount(tx, companyId, wage, 'wage payment');

          await tx.fundingAllocation.create({
            data: {
              fundingSourceId: mainAccount.id,
              amount: wage,
              attendanceId: attendance.id,
            }
          });
        }

        results.push(attendance);
      }

      return results;
    });
  }

  async findByProject(projectId: string, companyId: string, date?: string) {
    return this.prisma.attendance.findMany({
      where: {
        projectId,
        project: { companyId },
        ...(date ? { date: new Date(date) } : {}),
      },
      include: { worker: { select: { id: true, firstName: true, lastName: true, skillType: true, dailyRate: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getPayrollSummary(companyId: string, startDate: string, endDate: string) {
    const { start, end } = parseRequiredDateRange(startDate, endDate);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        worker: { companyId },
        date: { gte: start, lte: end },
      },
      include: {
        worker: { select: { id: true, firstName: true, lastName: true, skillType: true, dailyRate: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Group by worker and calculate totals
    const workerMap = new Map<string, any>();
    for (const record of attendance) {
      const key = record.workerId;
      if (!workerMap.has(key)) {
        workerMap.set(key, {
          workerId: record.worker.id,
          firstName: record.worker.firstName,
          lastName: record.worker.lastName,
          skillType: record.worker.skillType ?? 'General',
          dailyRate: Number(record.worker.dailyRate),
          daysPresent: 0,
          halfDays: 0,
          totalOvertimeHours: 0,
          totalExtraPay: 0,
          totalEarnings: 0,
          projects: new Set<string>(),
        });
      }
      const entry = workerMap.get(key)!;
      if (record.status === 'PRESENT') entry.daysPresent += 1;
      else if (record.status === 'HALF_DAY') entry.halfDays += 1;
      entry.totalOvertimeHours += Number(record.overtimeHours ?? 0);
      entry.totalExtraPay += Number(record.extraAmount ?? 0);
      entry.totalEarnings += Number(record.dailyWage);
      entry.projects.add(record.project.name);
    }

    return Array.from(workerMap.values()).map((e) => ({
      ...e,
      projects: Array.from(e.projects),
    }));
  }
}
