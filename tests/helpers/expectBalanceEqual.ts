import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { expect } from 'vitest';

export const expectBalanceEqual = (
  actualBalance: Unit<UnitCode> | null,
  expectedBalance: Unit<UnitCode> | null,
  accountName: string,
) => {
  expect(
    actualBalance,
    `Account balance doesn't match ${accountName}, expected ${expectedBalance?.format()}, actual ${actualBalance?.format()}`,
  ).toEqual(expectedBalance);
};
