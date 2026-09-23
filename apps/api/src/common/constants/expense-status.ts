import { Prisma } from '@prisma/client';

/**
 * Which expenses count as money spent.
 *
 * Creating an expense debits the Main Account straight away, so the project it
 * belongs to has to recognise it at the same moment. Spend used to be summed
 * over APPROVED and PAID only, which meant a fresh expense took the cash out
 * of the company balance while the project's "Spent" stayed at zero until
 * somebody approved it — the company and the project disagreed about the same
 * payment, with nothing on screen to explain the gap.
 *
 * A rejected expense is refunded, so it is the one status that does not count.
 */
export const SPENT_EXPENSE_STATUSES: Prisma.EnumExpenseStatusFilter = {
  not: 'REJECTED',
};
