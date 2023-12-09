import { UnitCode } from '@/ledger/units/Unit.js';
import { z } from 'zod';

const isString = (value: unknown): value is string => {
  return typeof value === 'string' || value instanceof String;
};

export const unitSchema = z.custom<UnitCode>((value: unknown) => {
  if (!isString(value)) {
    return false;
  }

  return true;
});
