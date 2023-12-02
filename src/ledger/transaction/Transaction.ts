import { Entry } from './Entry.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { DB_ID } from '@/types.js';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly entries: Entry[];

  public constructor(
    public readonly ledgerId: DB_ID,
    entries: TransactionDoubleEntries,
    public readonly description: string | null = null,
    public readonly postedAt: Date | null = new Date(),
  ) {
    this.entries = entries.flatEntries();
  }
}
