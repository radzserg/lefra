import { DoubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { DB_ID } from '@/types.js';

/**
 * Guarantees that all entries are of the same ledger.
 */
export class TransactionDoubleEntries {
  public entries: DoubleEntry[] = [];

  private ledgerId: DB_ID | null = null;

  public push(...entries: DoubleEntry[]): TransactionDoubleEntries {
    if (entries.length === 0) {
      return this;
    }

    if (!this.ledgerId) {
      this.ledgerId = entries[0].debitEntries[0].account.ledgerId;
    }

    for (const entry of entries) {
      for (const debitEntry of entry.debitEntries) {
        if (debitEntry.account.ledgerId !== this.ledgerId) {
          throw new Error('All entries must be of the same ledger');
        }
      }

      for (const creditEntry of entry.creditEntries) {
        if (creditEntry.account.ledgerId !== this.ledgerId) {
          throw new Error('All entries must be of the same ledger');
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
