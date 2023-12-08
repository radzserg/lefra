import { CreditEntry, DebitEntry } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { EntriesRenderer } from '@/ledger/renderer/EntriesRenderer.js';
import { EntriesWithSameAction } from '@/ledger/transaction/EntriesWithSameAction.js';
import { UnitCode } from '@/ledger/units/Unit.js';
import { NonEmptyArray } from '@/types.js';

/**
 * Represents double-entry bookkeeping entry. This means that the sum of all
 * debit entries must be equal to the sum of all credit entries.
 */
export type DoubleEntry<C extends UnitCode> = {
  readonly comment: string | null;
  readonly creditEntries: NonEmptyArray<CreditEntry<C>>;
  readonly debitEntries: NonEmptyArray<DebitEntry<C>>;
};

export const doubleEntry = <C extends UnitCode>(
  debitEntries: DebitEntry<C> | NonEmptyArray<DebitEntry<C>>,
  creditEntries: CreditEntry<C> | NonEmptyArray<CreditEntry<C>>,
  comment: string | null = null,
): DoubleEntry<C> => {
  const debitEntriesSet = EntriesWithSameAction.build(debitEntries);
  const creditEntriesSet = EntriesWithSameAction.build(creditEntries);

  const debitSum = debitEntriesSet.sum();
  const creditSum = creditEntriesSet.sum();
  if (!debitSum.equals(creditSum)) {
    const formatter = new EntriesRenderer();
    throw new LedgerError(
      `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}` +
        ` Entries:\n${formatter.render(debitEntriesSet.entries())}`,
    );
  }

  return {
    comment,
    creditEntries: creditEntriesSet.entries(),
    debitEntries: debitEntriesSet.entries(),
  };
};
