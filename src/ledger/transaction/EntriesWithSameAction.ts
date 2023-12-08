import { LedgerError } from '@/errors.js';
import { CreditEntry, DebitEntry } from '@/ledger/transaction/Entry.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { ArrayType, EntryAction, NonEmptyArray } from '@/types.js';

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class EntriesWithSameAction<
  C extends UnitCode,
  O extends DebitEntry<C> | CreditEntry<C>,
> {
  private readonly action: EntryAction;

  private readonly operationsSum: Unit<C>;

  private constructor(private readonly _entries: NonEmptyArray<O>) {
    if (Array.isArray(this._entries) && this._entries.length === 0) {
      throw new LedgerError('Operations array must not be empty');
    }

    this.action = this._entries[0].action;
    let sum = this._entries[0].amount.zeroValue();
    for (const operation of this._entries) {
      if (operation.action !== this.action) {
        throw new LedgerError('All operations must be of the same type');
      }

      if (!sum.isSameCurrency(operation.amount)) {
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
    C extends UnitCode,
    E extends
      | DebitEntry<C>
      | NonEmptyArray<DebitEntry<C>>
      | CreditEntry<C>
      | NonEmptyArray<CreditEntry<C>>,
  >(entries: E): EntriesWithSameAction<C, ArrayType<E>> {
    if (Array.isArray(entries)) {
      return new EntriesWithSameAction(entries);
    }

    return new EntriesWithSameAction([entries]) as EntriesWithSameAction<
      C,
      ArrayType<E>
    >;
  }

  public entries(): NonEmptyArray<O> {
    return this._entries;
  }

  public sum(): Unit<C> {
    return this.operationsSum;
  }
}
