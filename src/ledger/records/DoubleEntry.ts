import { CreditEntry, DebitEntry, UniformEntrySet } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { NonEmptyArray } from '@/types.js';

/**
 * Represents double-entry bookkeeping entry.
 */
export class DoubleEntry {
  public readonly debitEntries: UniformEntrySet<DebitEntry>;

  public readonly creditEntries: UniformEntrySet<CreditEntry>;

  public constructor(
    debitEntries: DebitEntry | NonEmptyArray<DebitEntry>,
    creditEntries: CreditEntry | NonEmptyArray<CreditEntry>,
    public readonly comment: string | null = null,
  ) {
    this.debitEntries = UniformEntrySet.build(debitEntries);
    this.creditEntries = UniformEntrySet.build(creditEntries);

    const debitSum = this.debitEntries.sum();
    const creditSum = this.creditEntries.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }
  }
}
