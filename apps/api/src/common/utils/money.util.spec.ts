import { BadRequestException } from '@nestjs/common';
import { parseAmount } from './money.util';

describe('parseAmount', () => {
  it('accepts a normal positive amount', () => {
    expect(parseAmount(25000, 'Amount')).toBe(25000);
    expect(parseAmount('1500.50', 'Amount')).toBe(1500.5);
  });

  it('rejects negative amounts', () => {
    // The bug this closes: a negative expense subtracted from a pool
    // (balance - (-500)) credited it instead, and the insufficient-balance
    // check never fired because a negative is always under the balance.
    expect(() => parseAmount(-50000, 'Expense amount')).toThrow(BadRequestException);
    expect(() => parseAmount('-0.01', 'Expense amount')).toThrow(BadRequestException);
  });

  it('rejects zero unless explicitly allowed', () => {
    expect(() => parseAmount(0, 'Amount')).toThrow(BadRequestException);
    expect(parseAmount(0, 'Amount', { allowZero: true })).toBe(0);
  });

  it('rejects values that are not numbers', () => {
    expect(() => parseAmount('abc', 'Amount')).toThrow(BadRequestException);
    expect(() => parseAmount(undefined, 'Amount')).toThrow(BadRequestException);
    expect(() => parseAmount(null, 'Amount')).toThrow(BadRequestException);
    expect(() => parseAmount('', 'Amount')).toThrow(BadRequestException);
    expect(() => parseAmount(NaN, 'Amount')).toThrow(BadRequestException);
    expect(() => parseAmount(Infinity, 'Amount')).toThrow(BadRequestException);
  });

  it('rejects values too large for the Decimal(15,2) columns', () => {
    expect(() => parseAmount(1e21, 'Amount')).toThrow(BadRequestException);
  });

  it('rounds to two decimal places to match the money columns', () => {
    expect(parseAmount(10.005, 'Amount')).toBe(10.01);
    expect(parseAmount(10.994, 'Amount')).toBe(10.99);
  });
});
