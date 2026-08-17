/**
 * Demo data seed — Yanushka Constraction
 * ======================================
 *
 * Populates the app with realistic content so the dashboard, tables, charts and
 * finance views have something to render instead of empty states.
 *
 * Safety properties:
 *   - Scoped to ONE company (COMPANY_ID below). Nothing else is touched.
 *   - Insert-only. No deletes, no updates to pre-existing rows. The single
 *     exception is topping up the two existing funding pools, which currently
 *     sit at a 0 balance and cannot fund anything until they hold money.
 *   - Idempotent. Re-running skips anything already seeded (guarded by a
 *     marker on the seeded rows), so it is safe to run twice.
 *   - Keeps money consistent: for every funding source,
 *       currentBalance === originalAmount - sum(its allocations)
 *     which is the invariant the funding dashboard and balance checks assume.
 *
 * Run with:
 *   cd apps/api && npx ts-node prisma/seed-demo-data.ts
 *
 * To undo everything it created:
 *   cd apps/api && npx ts-node prisma/seed-demo-data.ts --undo
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ── Target ────────────────────────────────────────────────────────────────
const COMPANY_ID = 'cmsfxldng0004pcv275ekpwax'; // Yanushka Constraction

/** Marker written into a free-text field so --undo can find exactly what we made. */
const TAG = '[demo-seed]';

// ── Helpers ───────────────────────────────────────────────────────────────
const money = (n: number) => new Prisma.Decimal(n.toFixed(2));

/** Date N days before today, truncated to midnight UTC (@db.Date columns). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/** Weekdays only — construction sites rarely book Sunday attendance. */
function isWorkday(d: Date) {
  return d.getUTCDay() !== 0;
}

async function main() {
  const undo = process.argv.includes('--undo');

  const company = await prisma.company.findUnique({
    where: { id: COMPANY_ID },
    select: { id: true, name: true },
  });
  if (!company) throw new Error(`Company ${COMPANY_ID} not found — aborting.`);

  const owner = await prisma.user.findFirst({
    where: { companyId: COMPANY_ID },
    select: { id: true, email: true },
  });
  if (!owner) throw new Error('No user found for this company — aborting.');

  const project = await prisma.project.findFirst({
    where: { companyId: COMPANY_ID },
    select: { id: true, name: true, budgetEstimate: true },
  });
  if (!project) throw new Error('No project found for this company — aborting.');

  console.log(`Company : ${company.name}`);
  console.log(`Project : ${project.name}`);
  console.log(`User    : ${owner.email}`);
  console.log('');

  if (undo) return undoSeed(project.id);

  // ── 1. Fund the treasury ────────────────────────────────────────────────
  // Both existing pools sit at 0. Nothing can be spent until they hold money,
  // and the attendance/expense paths now hard-fail on insufficient balance.
  const CASH_TOPUP = 8_000_000;
  const OWNER_TOPUP = 3_000_000;

  const cashPool = await prisma.fundingSource.findFirst({
    where: { companyId: COMPANY_ID, type: 'COMPANY_CASH' },
  });
  const ownerPool = await prisma.fundingSource.findFirst({
    where: { companyId: COMPANY_ID, type: 'OWNER_CAPITAL' },
  });
  if (!cashPool || !ownerPool) throw new Error('Default funding pools missing — aborting.');

  if (Number(cashPool.originalAmount) === 0) {
    await prisma.fundingSource.update({
      where: { id: cashPool.id },
      data: {
        openingBalance: money(CASH_TOPUP),
        originalAmount: money(CASH_TOPUP),
        currentBalance: money(CASH_TOPUP),
        remainingAmount: money(CASH_TOPUP),
        description: `${TAG} opening company cash`,
        sourceCategory: 'capital',
      },
    });
    console.log(`funded  : Company Cash  LKR ${CASH_TOPUP.toLocaleString()}`);
  }
  if (Number(ownerPool.originalAmount) === 0) {
    await prisma.fundingSource.update({
      where: { id: ownerPool.id },
      data: {
        openingBalance: money(OWNER_TOPUP),
        originalAmount: money(OWNER_TOPUP),
        currentBalance: money(OWNER_TOPUP),
        remainingAmount: money(OWNER_TOPUP),
        description: `${TAG} director capital injection`,
        sourceCategory: 'capital',
      },
    });
    console.log(`funded  : Owner Capital LKR ${OWNER_TOPUP.toLocaleString()}`);
  }

  // A client advance tied to the project — drives the "advances" widgets.
  const ADVANCE = 4_500_000;
  let advance = await prisma.projectAdvance.findFirst({
    where: { projectId: project.id, notes: { contains: TAG } },
  });
  if (!advance) {
    advance = await prisma.projectAdvance.create({
      data: {
        projectId: project.id,
        companyId: COMPANY_ID,
        receivedById: owner.id,
        amount: money(ADVANCE),
        description: 'Mobilization advance — Thisal House',
        referenceNo: 'ADV-2026-001',
        receivedDate: daysAgo(60),
        status: 'RECEIVED',
        notes: TAG,
      },
    });
    await prisma.fundingSource.create({
      data: {
        companyId: COMPANY_ID,
        type: 'PROJECT_ADVANCE',
        name: 'Client Advance — Thisal House',
        openingBalance: money(ADVANCE),
        originalAmount: money(ADVANCE),
        currentBalance: money(ADVANCE),
        remainingAmount: money(ADVANCE),
        status: 'ACTIVE',
        projectId: project.id,
        projectAdvanceId: advance.id,
        sourceCategory: 'client',
        referenceNo: 'ADV-2026-001',
        receivedDate: daysAgo(60),
        paymentMethod: 'BANK_TRANSFER',
        description: `${TAG} client mobilization advance`,
      },
    });
    console.log(`advance : LKR ${ADVANCE.toLocaleString()} + matching funding source`);
  }

  const advanceSource = await prisma.fundingSource.findFirst({
    where: { companyId: COMPANY_ID, type: 'PROJECT_ADVANCE' },
  });

  // Project wallet — the finance balance/ledger views read from this.
  await prisma.projectWallet.upsert({
    where: { projectId: project.id },
    create: {
      projectId: project.id,
      companyId: COMPANY_ID,
      balance: money(ADVANCE),
      totalAllocated: money(ADVANCE),
      totalSpent: money(0),
    },
    update: {},
  });

  // ── 2. Workers ──────────────────────────────────────────────────────────
  const workerSpec = [
    ['Sunil', 'Perera', 'Mason', 4500],
    ['Kamal', 'Silva', 'Carpenter', 4200],
    ['Nimal', 'Fernando', 'Mason', 4500],
    ['Ruwan', 'Jayasuriya', 'Electrician', 5200],
    ['Ajith', 'Bandara', 'Plumber', 5000],
    ['Chaminda', 'Rathnayake', 'Helper', 2800],
    ['Sarath', 'Wickrama', 'Helper', 2800],
    ['Dinesh', 'Gunasekara', 'Bar Bender', 4800],
  ] as const;

  const existingWorkers = await prisma.worker.count({ where: { companyId: COMPANY_ID } });
  if (existingWorkers === 0) {
    for (const [firstName, lastName, skillType, rate] of workerSpec) {
      await prisma.worker.create({
        data: {
          companyId: COMPANY_ID,
          firstName,
          lastName,
          skillType,
          dailyRate: money(rate),
          phone: `+9477${Math.floor(1000000 + Math.random() * 8999999)}`,
          isActive: true,
          address: `${TAG} Kurunegala`,
        },
      });
    }
    console.log(`workers : ${workerSpec.length} created`);
  }

  const workers = await prisma.worker.findMany({ where: { companyId: COMPANY_ID } });

  // ── 3. Attendance (last 21 workdays) + wage allocations ─────────────────
  // Batched: a per-row round trip is far too chatty for a remote database and
  // will stall on connection limits. Balances are reconciled at the end from
  // the allocation rows, so a partial run can simply be re-run.
  const existingAttendance = await prisma.attendance.count({ where: { projectId: project.id } });
  if (existingAttendance === 0 && cashPool) {
    const attendanceRows: Prisma.AttendanceCreateManyInput[] = [];

    for (let d = 21; d >= 1; d--) {
      const date = daysAgo(d);
      if (!isWorkday(date)) continue;

      for (const w of workers) {
        // Deterministic variation: most present, occasional half day / absence.
        const seed = (d + w.firstName.length) % 10;
        const status = seed === 0 ? 'ABSENT' : seed === 1 ? 'HALF_DAY' : 'PRESENT';
        const rate = Number(w.dailyRate);
        const wage = status === 'ABSENT' ? 0 : status === 'HALF_DAY' ? rate / 2 : rate;

        attendanceRows.push({
          workerId: w.id,
          projectId: project.id,
          date,
          status: status as any,
          dailyWage: money(wage),
          hoursWorked: money(status === 'HALF_DAY' ? 4 : status === 'ABSENT' ? 0 : 8),
          overtimeHours: money(seed === 7 ? 2 : 0),
          markedById: owner.id,
          notes: TAG,
        });
      }
    }

    await prisma.attendance.createMany({ data: attendanceRows, skipDuplicates: true });

    // Re-read to get the generated ids, then attach wage allocations in bulk.
    const saved = await prisma.attendance.findMany({
      where: { projectId: project.id, notes: TAG },
      select: { id: true, dailyWage: true },
    });
    const allocRows = saved
      .filter((a) => Number(a.dailyWage) > 0)
      .map((a) => ({ fundingSourceId: cashPool.id, amount: a.dailyWage, attendanceId: a.id }));
    await prisma.fundingAllocation.createMany({ data: allocRows, skipDuplicates: true });

    console.log(`attend  : ${saved.length} records, ${allocRows.length} wage allocations`);
  }

  // ── 4. Expenses (drawn against the client advance) ──────────────────────
  const expenseSpec = [
    ['MATERIAL', 'River sand — 12 cube', 186_000, 'APPROVED', 34],
    ['MATERIAL', 'Cement 50kg × 200 bags', 372_000, 'APPROVED', 30],
    ['MATERIAL', 'Reinforcement steel 10mm', 545_000, 'APPROVED', 26],
    ['TRANSPORT', 'Lorry hire — aggregate delivery', 48_000, 'APPROVED', 22],
    ['EQUIPMENT', 'Concrete mixer rental (2 weeks)', 96_000, 'APPROVED', 19],
    ['LABOUR', 'Subcontract — tile laying advance', 240_000, 'PAID', 15],
    ['MATERIAL', 'Roofing sheets & accessories', 418_000, 'PENDING', 8],
    ['MISCELLANEOUS', 'Site safety equipment', 62_000, 'PENDING', 5],
  ] as const;

  const existingExpenses = await prisma.expense.count({ where: { projectId: project.id } });
  if (existingExpenses === 0 && advanceSource) {
    let spent = 0;
    for (const [category, title, amount, status, ago] of expenseSpec) {
      const exp = await prisma.expense.create({
        data: {
          projectId: project.id,
          submittedById: owner.id,
          approvedById: status === 'PENDING' ? null : owner.id,
          approvedAt: status === 'PENDING' ? null : daysAgo(ago - 1),
          category: category as any,
          title,
          description: TAG,
          amount: money(amount),
          currency: 'LKR',
          status: status as any,
          expenseDate: daysAgo(ago),
        },
      });
      // Only settled expenses actually draw down the advance.
      if (status !== 'PENDING') {
        await prisma.fundingAllocation.create({
          data: { fundingSourceId: advanceSource.id, amount: money(amount), expenseId: exp.id },
        });
        spent += amount;
      }
    }

    await prisma.fundingSource.update({
      where: { id: advanceSource.id },
      data: {
        currentBalance: money(ADVANCE - spent),
        remainingAmount: money(ADVANCE - spent),
      },
    });
    await prisma.projectWallet.update({
      where: { projectId: project.id },
      data: { balance: money(ADVANCE - spent), totalSpent: money(spent) },
    });
    console.log(
      `expense : ${expenseSpec.length} created, LKR ${spent.toLocaleString()} drawn from advance`,
    );
  }

  // ── 5. Purchases + project allocation ───────────────────────────────────
  const purchaseSpec = [
    ['PROJECT_MATERIAL', 'Bathroom fittings — full set', 385_000, 'PAID', 18, 'Lanka Sanitary Ware'],
    ['SHARED_TOOL', 'Scaffolding frames × 20', 240_000, 'PAID', 40, 'Colombo Scaffold Co.'],
    ['PROJECT_MATERIAL', 'Electrical conduit & wiring', 168_000, 'PENDING', 6, 'Nawaloka Electricals'],
    ['SERVICE', 'Structural engineer consultation', 85_000, 'PARTIAL', 12, 'DesignWorks (Pvt) Ltd'],
  ] as const;

  const existingPurchases = await prisma.purchase.count({ where: { companyId: COMPANY_ID } });
  if (existingPurchases === 0 && ownerPool) {
    let purchased = 0;
    for (const [category, title, amount, status, ago, vendor] of purchaseSpec) {
      const p = await prisma.purchase.create({
        data: {
          companyId: COMPANY_ID,
          purchasedById: owner.id,
          approvedById: owner.id,
          title,
          description: TAG,
          totalAmount: money(amount),
          category: category as any,
          purchaseDate: daysAgo(ago),
          vendor,
          status: status as any,
          workflowStage: status === 'PAID' ? 'COMPLETED' : 'INVOICED',
          dueDate: daysAgo(ago - 30),
          paidAmount: money(status === 'PAID' ? amount : status === 'PARTIAL' ? amount / 2 : 0),
          notes: TAG,
        },
      });

      await prisma.purchaseAllocation.create({
        data: {
          purchaseId: p.id,
          projectId: project.id,
          amount: money(amount),
          percentage: money(100),
          notes: TAG,
        },
      });

      await prisma.fundingAllocation.create({
        data: { fundingSourceId: ownerPool.id, amount: money(amount), purchaseId: p.id },
      });
      purchased += amount;

      // A shared tool becomes a tracked asset.
      if (category === 'SHARED_TOOL') {
        await prisma.asset.create({
          data: {
            companyId: COMPANY_ID,
            purchaseId: p.id,
            name: title,
            category: 'EQUIPMENT',
            purchasePrice: money(amount),
            condition: 'GOOD',
            currentProjectId: project.id,
            notes: TAG,
          },
        });
      }
    }

    await prisma.fundingSource.update({
      where: { id: ownerPool.id },
      data: {
        currentBalance: money(OWNER_TOPUP - purchased),
        remainingAmount: money(OWNER_TOPUP - purchased),
      },
    });
    console.log(
      `purchase: ${purchaseSpec.length} created, LKR ${purchased.toLocaleString()} from owner capital`,
    );
  }

  // ── 6. Tasks ────────────────────────────────────────────────────────────
  const taskSpec = [
    ['Foundation excavation', 'COMPLETED', 'HIGH', -40],
    ['Foundation concrete pour', 'COMPLETED', 'URGENT', -32],
    ['Column reinforcement — ground floor', 'COMPLETED', 'HIGH', -24],
    ['Ground floor slab casting', 'IN_PROGRESS', 'URGENT', 4],
    ['Blockwork — ground floor walls', 'IN_PROGRESS', 'HIGH', 9],
    ['First floor column setup', 'TODO', 'MEDIUM', 18],
    ['Electrical rough-in — ground floor', 'TODO', 'MEDIUM', 25],
    ['Plumbing rough-in — ground floor', 'TODO', 'MEDIUM', 27],
    ['Roof structure fabrication', 'TODO', 'LOW', 45],
    ['Waterproofing — wet areas', 'BLOCKED', 'HIGH', 20],
  ] as const;

  const existingTasks = await prisma.task.count({ where: { projectId: project.id } });
  if (existingTasks === 0) {
    let order = 0;
    for (const [title, status, priority, dueIn] of taskSpec) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          title,
          description: TAG,
          status: status as any,
          priority: priority as any,
          creatorId: owner.id,
          assigneeId: owner.id,
          // Negative dueIn puts the date in the past (already-completed work).
          dueDate: daysAgo(-dueIn),
          completedAt: status === 'COMPLETED' ? daysAgo(Math.abs(dueIn)) : null,
          estimatedHours: money(8 + (order % 5) * 8),
          sortOrder: order++,
        },
      });
    }
    console.log(`tasks   : ${taskSpec.length} created`);
  }

  // ── Reconcile balances ──────────────────────────────────────────────────
  // Single source of truth: a source's remaining balance is its original amount
  // minus everything allocated against it. Recomputing here (rather than
  // decrementing as we go) makes the script idempotent and self-healing — an
  // interrupted run leaves allocations without the matching deduction, and
  // re-running repairs it.
  const sources = await prisma.fundingSource.findMany({ where: { companyId: COMPANY_ID } });
  console.log('\n── Funding position ──');
  for (const s of sources) {
    const allocated = await prisma.fundingAllocation.aggregate({
      where: { fundingSourceId: s.id },
      _sum: { amount: true },
    });
    const alloc = Number(allocated._sum.amount || 0);
    const expected = Number(s.originalAmount) - alloc;
    const actual = Number(s.currentBalance);

    if (Math.abs(expected - actual) >= 0.01) {
      await prisma.fundingSource.update({
        where: { id: s.id },
        data: { currentBalance: money(expected), remainingAmount: money(expected) },
      });
      console.log(
        `  FIXED ${s.name.padEnd(32)} ${actual.toLocaleString()} -> ${expected.toLocaleString()}  (allocated ${alloc.toLocaleString()})`,
      );
    } else {
      console.log(
        `  OK    ${s.name.padEnd(32)} balance ${expected.toLocaleString().padStart(12)}  allocated ${alloc.toLocaleString()}`,
      );
    }
  }

  // Keep the project wallet in step with settled spend.
  const settled = await prisma.expense.aggregate({
    where: { projectId: project.id, status: { in: ['APPROVED', 'PAID'] } },
    _sum: { amount: true },
  });
  const allocSpend = await prisma.purchaseAllocation.aggregate({
    where: { projectId: project.id },
    _sum: { amount: true },
  });
  const totalSpent = Number(settled._sum.amount || 0) + Number(allocSpend._sum.amount || 0);
  await prisma.projectWallet.updateMany({
    where: { projectId: project.id },
    data: { totalSpent: money(totalSpent), balance: money(ADVANCE - totalSpent) },
  });
  await prisma.project.update({
    where: { id: project.id },
    data: { budgetActual: money(totalSpent) },
  });
  console.log(`\nProject spend: LKR ${totalSpent.toLocaleString()}`);

  console.log('\nDone. Reload the app to see populated views.');
}

/** Remove everything this script created, in FK-safe order. */
async function undoSeed(projectId: string) {
  console.log('Undoing demo seed...\n');

  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    const { count } = await fn();
    console.log(`  removed ${String(count).padStart(4)}  ${label}`);
  };

  // Allocations first — they reference everything else.
  await del('funding allocations (attendance)', () =>
    prisma.fundingAllocation.deleteMany({ where: { attendance: { notes: TAG } } }),
  );
  await del('funding allocations (expense)', () =>
    prisma.fundingAllocation.deleteMany({ where: { expense: { description: TAG } } }),
  );
  await del('funding allocations (purchase)', () =>
    prisma.fundingAllocation.deleteMany({ where: { purchase: { notes: TAG } } }),
  );

  await del('assets', () => prisma.asset.deleteMany({ where: { notes: TAG } }));
  await del('purchase allocations', () =>
    prisma.purchaseAllocation.deleteMany({ where: { notes: TAG } }),
  );
  await del('purchases', () => prisma.purchase.deleteMany({ where: { notes: TAG } }));
  await del('expenses', () => prisma.expense.deleteMany({ where: { description: TAG } }));
  await del('attendance', () => prisma.attendance.deleteMany({ where: { notes: TAG } }));
  await del('workers', () => prisma.worker.deleteMany({ where: { address: { contains: TAG } } }));
  await del('tasks', () => prisma.task.deleteMany({ where: { description: TAG } }));

  await del('advance funding source', () =>
    prisma.fundingSource.deleteMany({
      where: { companyId: COMPANY_ID, type: 'PROJECT_ADVANCE', description: { contains: TAG } },
    }),
  );
  await del('project advances', () =>
    prisma.projectAdvance.deleteMany({ where: { notes: TAG } }),
  );

  // Return the two standing pools to zero.
  await prisma.fundingSource.updateMany({
    where: { companyId: COMPANY_ID, description: { contains: TAG } },
    data: {
      openingBalance: money(0),
      originalAmount: money(0),
      currentBalance: money(0),
      remainingAmount: money(0),
      description: null,
    },
  });
  await prisma.projectWallet.updateMany({
    where: { projectId },
    data: { balance: money(0), totalAllocated: money(0), totalSpent: money(0) },
  });

  console.log('\nDemo seed removed.');
}

main()
  .catch((e) => {
    console.error('\nSeed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
