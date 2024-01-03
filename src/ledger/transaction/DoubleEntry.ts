import { CreditEntry, DebitEntry } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { EntriesRenderer } from '@/ledger/renderer/EntriesRenderer.js';
import { EntriesWithSameAction } from '@/ledger/transaction/EntriesWithSameAction.js';
import { UnitCode } from '@/ledger/units/Unit.js';
import { ExtractUnitCode, NonEmptyArray } from '@/types.js';

/**
 * Represents double-entry bookkeeping entry. This means that the sum of all
 * debit entries must be equal to the sum of all credit entries.
 */
export type DoubleEntry<U extends UnitCode> = {
  readonly comment: string | null;
  readonly creditEntries: NonEmptyArray<CreditEntry<U>>;
  readonly debitEntries: NonEmptyArray<DebitEntry<U>>;
};

export const doubleEntry = <
  D extends DebitEntry<UnitCode> | NonEmptyArray<DebitEntry<UnitCode>>,
  C extends
    | CreditEntry<ExtractUnitCode<D>>
    | NonEmptyArray<CreditEntry<ExtractUnitCode<D>>>,
>(
  debitEntries: D,
  creditEntries: C,
  comment: string | null = null,
): DoubleEntry<ExtractUnitCode<D>> => {
  const debitEntriesSet = EntriesWithSameAction.build(debitEntries);
  const creditEntriesSet = EntriesWithSameAction.build(creditEntries);

  const debitSum = debitEntriesSet.sum();
  const creditSum = creditEntriesSet.sum();
  const creditSomeCode = creditSum.code;
  if (!debitSum.isSameCurrency(creditSum)) {
    throw new LedgerError(
      `Debit and credit operations must have the same currency. Debit currency: ${debitSum.code}, credit currency: ${creditSomeCode}`,
    );
  }

  if (!debitSum.equals(creditSum)) {
    const formatter = new EntriesRenderer();
    throw new LedgerError(
      `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}` +
        ` Entries:\n${formatter.render(debitEntriesSet.entries)}`,
    );
  }

  return {
    comment,
    creditEntries: creditEntriesSet.entries,
    debitEntries: debitEntriesSet.entries,
  };
};
