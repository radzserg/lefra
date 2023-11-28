import { CreditEntry, DebitEntry } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { EntriesWithSameAction } from '@/ledger/records/EntriesWithSameAction.js';
import { NonEmptyArray } from '@/types.js';

/**
 * Represents double-entry bookkeeping entry. This means that the sum of all
 * debit entries must be equal to the sum of all credit entries.
 */
export type DoubleEntry = {
  readonly comment: string | null;
  readonly creditEntries: NonEmptyArray<CreditEntry>;
  readonly debitEntries: NonEmptyArray<DebitEntry>;
};

export const doubleEntry = (
  debitEntries: DebitEntry | NonEmptyArray<DebitEntry>,
  creditEntries: CreditEntry | NonEmptyArray<CreditEntry>,
  comment: string | null = null,
): DoubleEntry => {
  const debitEntriesSet = EntriesWithSameAction.build(debitEntries);
  const creditEntriesSet = EntriesWithSameAction.build(creditEntries);

  const debitSum = debitEntriesSet.sum();
  const creditSum = creditEntriesSet.sum();
  if (!debitSum.equals(creditSum)) {
    throw new LedgerError(
      `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
    );
  }

  return {
    comment,
    creditEntries: creditEntriesSet.entries(),
    debitEntries: debitEntriesSet.entries(),
  };
};
