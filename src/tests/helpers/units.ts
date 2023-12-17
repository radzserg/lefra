import { Unit } from '@/ledger/units/Unit.js';
import { BigNumber } from 'bignumber.js';

export const usd = (amount: BigNumber | number | string) => {
  return new Unit(amount, 'USD', 2);
};

export const cad = (amount: BigNumber | number | string) => {
  return new Unit(amount, 'CAD', 2);
};
