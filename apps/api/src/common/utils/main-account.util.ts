import { BadRequestException } from '@nestjs/common';

/**
 * The company keeps one spendable balance: the Main Account.
 *
 * Money used to sit in a pile of separate pools, and every expense, purchase
 * or wage payment made the user pick which pool to draw from — a choice they
 * had no way to answer meaningfully, and which let the same rupee look
 * available in two places at once. Now every inflow (a loan drawdown, a client
 * advance, owner capital) credits this one account, and every outflow debits
 * it. The other funding rows survive as provenance: they record where the
 * money came from, and hold no balance of their own.
 */

type Tx = {
  fundingSource: {
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<any>;
  };
};

export const MAIN_ACCOUNT_NAME = 'Main Account';

/**
 * Returns the company's main account, adopting one on first use.
 *
 * Companies created before the main account existed have their pools folded
 * into a single account here, carrying the combined balance across so no money
 * appears or disappears. This runs inside the caller's transaction and is
 * idempotent, so it is safe on every request.
 */
export async function getMainAccount(tx: Tx, companyId: string) {
  const existing = await tx.fundingSource.findFirst({
    where: { companyId, isMain: true },
  });
  if (existing) return existing;

  const sources = await tx.fundingSource.findMany({ where: { companyId } });
  const pooled = sources.reduce(
    (sum: number, s: any) => sum + Number(s.currentBalance),
    0,
  );

  const main = await tx.fundingSource.create({
    data: {
      companyId,
      isMain: true,
      type: 'COMPANY_CASH',
      name: MAIN_ACCOUNT_NAME,
      openingBalance: pooled,
      currentBalance: pooled,
      originalAmount: pooled,
      remainingAmount: pooled,
      status: 'ACTIVE',
      sourceCategory: 'capital',
      description:
        'The company balance. Every funding record credits this account and every payment is drawn from it.',
    },
  });

  // The old pools keep their originalAmount so the history of where money came
  // from is intact, but they stop holding a spendable balance.
  await tx.fundingSource.updateMany({
    where: { companyId, id: { not: main.id } },
    data: { currentBalance: 0, remainingAmount: 0 },
  });

  return main;
}

/** Adds money to the company balance. */
export async function creditMainAccount(
  tx: Tx,
  companyId: string,
  amount: number,
) {
  const main = await getMainAccount(tx, companyId);
  return tx.fundingSource.update({
    where: { id: main.id },
    data: {
      currentBalance: { increment: amount },
      remainingAmount: { increment: amount },
      originalAmount: { increment: amount },
    },
  });
}

/**
 * Takes money off the company balance, refusing to overdraw.
 *
 * The balance is re-read inside the caller's transaction rather than trusted
 * from an earlier read, so two payments submitted at the same time cannot both
 * pass the check and push the company negative.
 */
export async function debitMainAccount(
  tx: Tx,
  companyId: string,
  amount: number,
  label = 'payment',
) {
  const main = await getMainAccount(tx, companyId);
  const available = Number(main.currentBalance);

  if (available < amount) {
    throw new BadRequestException(
      `Main Account has LKR ${available.toLocaleString()} available, which is not enough for this ${label} of LKR ${amount.toLocaleString()}. Add funding first.`,
    );
  }

  return tx.fundingSource.update({
    where: { id: main.id },
    data: {
      currentBalance: { decrement: amount },
      remainingAmount: { decrement: amount },
    },
  });
}
