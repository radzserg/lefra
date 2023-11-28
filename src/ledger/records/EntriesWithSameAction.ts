import { LedgerError } from '@/errors.js';
import { CreditEntry, DebitEntry } from '@/ledger/records/Entry.js';
import { CurrencyCode } from '@/money/currencies.js';
import { Money } from '@/money/Money.js';
import { ArrayType, EntryAction, NonEmptyArray } from '@/types.js';

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class EntriesWithSameAction<O extends DebitEntry | CreditEntry> {
  private readonly action: EntryAction;

  private readonly currencyCode: CurrencyCode;

  private readonly operationsSum: Money;

  private constructor(private readonly _entries: NonEmptyArray<O>) {
    if (Array.isArray(this._entries) && this._entries.length === 0) {
      throw new LedgerError('Operations array must not be empty');
    }

    this.action = this._entries[0].action;
    this.currencyCode = this._entries[0].amount.currencyCode;

    let sum = new Money(0, this.currencyCode);
    for (const operation of this._entries) {
      if (operation.action !== this.action) {
        throw new LedgerError('All operations must be of the same type');
      }

      if (operation.amount.currencyCode !== this.currencyCode) {
        throw new LedgerError('All operations must be of the same currency');
      }

      sum = sum.plus(operation.amount);
    }

    if (sum.isZero()) {
      throw new LedgerError('Operations must not sum to zero');
    }

    this.operationsSum = sum;
  }

  public static build<
    E extends
      | DebitEntry
      | NonEmptyArray<DebitEntry>
      | CreditEntry
      | NonEmptyArray<CreditEntry>,
  >(entries: E): EntriesWithSameAction<ArrayType<E>> {
    if (Array.isArray(entries)) {
      return new EntriesWithSameAction(entries);
    }

    return new EntriesWithSameAction([entries]) as EntriesWithSameAction<
      ArrayType<E>
    >;
  }

  public entries(): NonEmptyArray<O> {
    return this._entries;
  }

  public sum(): Money {
    return this.operationsSum;
  }
}
