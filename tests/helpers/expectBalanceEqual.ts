import { Money } from '@/money/Money.js';
import { expect } from 'vitest';

export const expectBalanceEqual = (
  actualBalance: Money | null,
  expectedBalance: Money | null,
  accountName: string,
) => {
  expect(
    actualBalance,
    `Account balance doesn't match ${accountName}, expected ${expectedBalance?.format()}, actual ${actualBalance?.format()}`,
  ).toEqual(expectedBalance);
};
