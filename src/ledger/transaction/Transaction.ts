import { DoubleEntry } from './DoubleEntry.js';
import { Entry } from './Entry.js';
import { DB_ID } from '@/types.js';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly entries: Entry[];

  public constructor(
    public readonly ledgerId: DB_ID,
    entries: DoubleEntry[],
    public readonly description: string | null = null,
    public readonly postedAt: Date | null = new Date(),
  ) {
    const transactionEntries: Entry[] = [];
    for (const entry of entries) {
      transactionEntries.push(...entry.debitEntries, ...entry.creditEntries);
    }

    this.entries = transactionEntries.map((entry) => {
      return entry;
    });

    // @todo check that all entries are of the same ledger
  }
}
