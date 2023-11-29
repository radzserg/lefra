import { DoubleEntry } from './DoubleEntry.js';
import { Entry } from './Entry.js';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly entries: Entry[];

  public constructor(
    entries: DoubleEntry[],
    public readonly description: string | null = null,
  ) {
    const transactionEntries: Entry[] = [];
    for (const entry of entries) {
      transactionEntries.push(...entry.debitEntries, ...entry.creditEntries);
    }

    this.entries = transactionEntries.map((entry) => {
      return entry;
    });
  }
}
