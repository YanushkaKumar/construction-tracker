import { BadRequestException } from '@nestjs/common';

/**
 * Money amounts arrive from untyped request bodies across the finance
 * modules, and the balance maths subtracts them directly from funding pools.
 * A negative value therefore *adds* funds (`balance - (-500)`), and the
 * "insufficient balance" guards don't catch it because a negative amount is
 * always below the available balance. Parse every incoming amount through
 * here so that can't happen.
 */
export function parseAmount(
  value: unknown,
  label = 'Amount',
  { allowZero = false }: { allowZero?: boolean } = {},
): number {
  const amount = Number(value);

  if (value === null || value === undefined || value === '' || !Number.isFinite(amount)) {
    throw new BadRequestException(`${label} must be a valid number`);
  }
  if (amount < 0) {
    throw new BadRequestException(`${label} cannot be negative`);
  }
  if (!allowZero && amount === 0) {
    throw new BadRequestException(`${label} must be greater than zero`);
  }

  // Guard against precision junk (e.g. 1e21) reaching Prisma's Decimal columns,
  // which are Decimal(15,2) — anything beyond that silently loses accuracy.
  if (amount > 9_999_999_999_999) {
    throw new BadRequestException(`${label} exceeds the maximum supported value`);
  }

  return Math.round(amount * 100) / 100;
}
