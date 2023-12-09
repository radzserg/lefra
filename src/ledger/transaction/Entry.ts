import { LedgerAccountRef } from '../accounts/LedgerAccountRef.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

export type CreditEntry<C extends UnitCode> = {
  account: LedgerAccountRef;
  action: 'CREDIT';
  amount: Unit<C>;
};

export type DebitEntry<C extends UnitCode> = {
  account: LedgerAccountRef;
  action: 'DEBIT';
  amount: Unit<C>;
};

export type Entry<C extends UnitCode = UnitCode> =
  | CreditEntry<C>
  | DebitEntry<C>;

const validateEntry = <C extends UnitCode>(entry: Entry<C>) => {
  if (entry.amount.isZero()) {
    throw new Error('Cannot create entry with zero amount');
  }
};

export const credit = <C extends UnitCode>(
  account: LedgerAccountRef,
  amount: Unit<C>,
): CreditEntry<C> => {
  const entry = {
    account,
    action: 'CREDIT' as const,
    amount,
  };
  validateEntry(entry);
  return entry;
};

export const debit = <C extends UnitCode>(
  account: LedgerAccountRef,
  amount: Unit<C>,
): DebitEntry<C> => {
  const entry = {
    account,
    action: 'DEBIT' as const,
    amount,
  };
  validateEntry(entry);
  return entry;
};
