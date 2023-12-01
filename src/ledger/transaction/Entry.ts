import { LedgerAccountRef } from '../accounts/LedgerAccountRef.js';
import { Money } from '@/money/Money.js';

export type CreditEntry = {
  account: LedgerAccountRef;
  action: 'CREDIT';
  amount: Money;
};

export type DebitEntry = {
  account: LedgerAccountRef;
  action: 'DEBIT';
  amount: Money;
};

export type Entry = CreditEntry | DebitEntry;

const validateEntry = (entry: Entry) => {
  if (entry.amount.isZero()) {
    throw new Error('Cannot create entry with zero amount');
  }

  if (entry.amount.isLessThan(new Money(0, entry.amount.currencyCode))) {
    throw new Error('Cannot create entry with negative amount');
  }
};

export const credit = (
  account: LedgerAccountRef,
  amount: Money,
): CreditEntry => {
  const entry = {
    account,
    action: 'CREDIT' as const,
    amount,
  };
  validateEntry(entry);
  return entry;
};

export const debit = (account: LedgerAccountRef, amount: Money): DebitEntry => {
  const entry = {
    account,
    action: 'DEBIT' as const,
    amount,
  };
  validateEntry(entry);
  return entry;
};
