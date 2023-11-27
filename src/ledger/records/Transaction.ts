import { DoubleEntry } from './DoubleEntry.js';
import { Entry } from './Entry.js';
import { v4 as uuid } from 'uuid';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly id: string = uuid();

  public readonly entries: Entry[];

  public constructor(
    public readonly ledgerId: string,
    entries: DoubleEntry[],
    public readonly description: string | null = null,
  ) {
    const transactionEntries: Entry[] = [];
    for (const entry of entries) {
      transactionEntries.push(
        ...entry.debitEntries.entries(),
        ...entry.creditEntries.entries(),
      );
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
