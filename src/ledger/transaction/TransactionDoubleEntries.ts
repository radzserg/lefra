import { LedgerError } from '@/errors.js';
import { DoubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { Entry } from '@/ledger/transaction/Entry.js';

/**
 * Guarantees that all entries are of the same ledger.
 */
export class TransactionDoubleEntries {
  public entries: DoubleEntry[] = [];

  public ledgerSlug: string | null = null;

  public push(...entries: DoubleEntry[]): TransactionDoubleEntries {
    if (entries.length === 0) {
      return this;
    }

    if (!this.ledgerSlug) {
      this.ledgerSlug = entries[0].debitEntries[0].account.ledgerSlug;
    }

    for (const entry of entries) {
      for (const debitEntry of entry.debitEntries) {
        if (debitEntry.account.ledgerSlug !== this.ledgerSlug) {
          throw new LedgerError('All entries must belong to the same ledger');
        }
      }

      for (const creditEntry of entry.creditEntries) {
        if (creditEntry.account.ledgerSlug !== this.ledgerSlug) {
          throw new LedgerError('All entries must belong to the same ledger');
        }
      }

      this.entries.push(entry);
    }

    return this;
  }

  public append(
    transactionDoubleEntries: TransactionDoubleEntries,
  ): TransactionDoubleEntries {
    return this.push(...transactionDoubleEntries.entries);
  }

  public flatEntries(): Entry[] {
    const flatEntries: Entry[] = [];
    for (const entry of this.entries) {
      flatEntries.push(...entry.debitEntries, ...entry.creditEntries);
    }

    return flatEntries;
  }
}
