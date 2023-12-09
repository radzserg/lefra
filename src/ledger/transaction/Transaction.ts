import { Entry } from './Entry.js';
import { LedgerUnexpectedError } from '@/errors.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { UnitCode } from '@/ledger/units/Unit.js';
import { NonEmptyArray } from '@/types.js';
import { isNonEmptyArray } from '@/utils.js';

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction<U extends UnitCode = UnitCode> {
  public readonly entries: NonEmptyArray<Entry<U>>;

  public readonly ledgerSlug: string;

  public constructor(
    public readonly transactionDoubleEntries: TransactionDoubleEntries<U>,
    public readonly description: string | null = null,
    public readonly postedAt: Date | null = new Date(),
  ) {
    const flatEntries = transactionDoubleEntries.flatEntries();
    if (!isNonEmptyArray(flatEntries)) {
      throw new LedgerUnexpectedError('Transaction has no entries');
    }

    this.entries = flatEntries;

    const ledgerId = transactionDoubleEntries.ledgerSlug;
    if (!ledgerId) {
      throw new LedgerUnexpectedError('Transaction has no entries');
    }

    this.ledgerSlug = ledgerId;
  }
}
