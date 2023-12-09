import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { z } from 'zod';

export const moneySchema = z.custom<Unit<UnitCode>>((value) => {
  return value instanceof Unit;
});

export const usdSchema = z.custom<Unit<'USD'>>((value) => {
  return value instanceof Unit && value.code === 'USD';
});
