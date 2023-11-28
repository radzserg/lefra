import { DoubleEntry } from './DoubleEntry.js';
import { Entry } from './Entry.js';
import { INTERNAL_ID } from '@/types.js';
import { v4 as uuid } from 'uuid';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly id: INTERNAL_ID = uuid();

  public readonly entries: Entry[];

  public constructor(
    public readonly ledgerId: INTERNAL_ID,
    entries: DoubleEntry[],
    public readonly description: string | null = null,
  ) {
    const transactionEntries: Entry[] = [];
    for (const entry of entries) {
      transactionEntries.push(...entry.debitEntries, ...entry.creditEntries);
    }

    this.entries = transactionEntries.map((entry) => {
      entry.transactionId = this.id;
      return entry;
    });
  }

  public toJSON() {
    return {
      description: this.description,
      entries: this.entries,
      id: this.id,
      ledgerId: this.ledgerId,
    };
  }
}
