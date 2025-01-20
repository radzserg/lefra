import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { expect } from 'vitest';

export const expectBalanceEqual = (
  actualBalance: null | Unit<UnitCode>,
  expectedBalance: null | Unit<UnitCode>,
  accountName: string,
) => {
  expect(
    actualBalance,
    `Account balance doesn't match ${accountName}, expected ${expectedBalance?.format()}, actual ${actualBalance?.format()}`,
  ).toEqual(expectedBalance);
};
