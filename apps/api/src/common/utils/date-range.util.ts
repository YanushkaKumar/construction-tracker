import { BadRequestException } from '@nestjs/common';

/**
 * Parse a required start/end date pair coming from query parameters.
 *
 * `new Date(undefined)` and `new Date('')` both yield an Invalid Date, which
 * Prisma rejects at the driver level and surfaces as an opaque 500. Callers can
 * omit these params entirely, and the UI's date inputs can be cleared to an
 * empty string, so validate up front and fail with a 400 instead.
 */
export function parseRequiredDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
): { start: Date; end: Date } {
  if (!startDate || !endDate) {
    throw new BadRequestException('startDate and endDate query parameters are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime())) {
    throw new BadRequestException(`Invalid startDate: "${startDate}"`);
  }
  if (Number.isNaN(end.getTime())) {
    throw new BadRequestException(`Invalid endDate: "${endDate}"`);
  }
  if (start > end) {
    throw new BadRequestException('startDate must not be after endDate');
  }

  return { start, end };
}

/**
 * Parses a date that a request is required to supply.
 *
 * `new Date(undefined)` yields an Invalid Date, which Prisma rejects deep
 * inside the query with a validation error — the caller sees a bare 500 and
 * no hint that a date was missing. Recording a client advance without one did
 * exactly that.
 */
export function parseRequiredDate(value: unknown, label = 'Date'): Date {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(`${label} is required`);
  }
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${label} must be a valid date`);
  }
  return parsed;
}
