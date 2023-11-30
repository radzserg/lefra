import { Money } from './Money.js';
import { CurrencyCode, currencyCodes } from '@/money/currencies.js';
import { z } from 'zod';

const isString = (value: unknown): value is string => {
  return typeof value === 'string' || value instanceof String;
};

export const moneySchema = z.custom<Money>((value) => {
  return value instanceof Money;
});

export const usdSchema = z.custom<Money<'USD'>>((value) => {
  return value instanceof Money && value.currencyCode === 'USD';
});

export const currencyCodeSchema = z.custom<CurrencyCode>((value) => {
  if (!isString(value)) {
    return false;
  }

  return currencyCodes.includes(value as CurrencyCode);
});
