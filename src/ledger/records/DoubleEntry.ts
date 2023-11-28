import { CreditEntry, DebitEntry, UniformEntrySet } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { NonEmptyArray } from '@/types.js';

/**
 * Represents double-entry bookkeeping entry.
 */
export class DoubleEntry {
  public readonly debitEntries: NonEmptyArray<DebitEntry>;

  public readonly creditEntries: NonEmptyArray<CreditEntry>;

  public constructor(
    debitEntries: DebitEntry | NonEmptyArray<DebitEntry>,
    creditEntries: CreditEntry | NonEmptyArray<CreditEntry>,
    public readonly comment: string | null = null,
  ) {
    const debitEntriesSet = UniformEntrySet.build(debitEntries);
    const creditEntriesSet = UniformEntrySet.build(creditEntries);

    const debitSum = debitEntriesSet.sum();
    const creditSum = creditEntriesSet.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }

    this.debitEntries = debitEntriesSet.entries();
    this.creditEntries = creditEntriesSet.entries();
  }
}
