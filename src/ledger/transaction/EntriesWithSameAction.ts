import { LedgerError } from '@/errors.js';
import { CreditEntry, DebitEntry } from '@/ledger/transaction/Entry.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { EntryAction, ExtractUnitCode, NonEmptyArray } from '@/types.js';

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class EntriesWithSameAction<
  O extends DebitEntry<UnitCode> | CreditEntry<UnitCode>,
> {
  private readonly action: EntryAction;

  private readonly operationsSum: Unit<ExtractUnitCode<O>>;

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

    this.operationsSum = sum as Unit<ExtractUnitCode<O>>;
  }

  public static build<
    C extends UnitCode,
    E extends
      | DebitEntry<C>
      | NonEmptyArray<DebitEntry<C>>
      | CreditEntry<C>
      | NonEmptyArray<CreditEntry<C>>,
  >(entries: E) {
    if (Array.isArray(entries)) {
      return new EntriesWithSameAction(entries);
    }

    return new EntriesWithSameAction([entries]);
  }

  public entries(): NonEmptyArray<O> {
    return this._entries;
  }

  public sum(): Unit<ExtractUnitCode<O>> {
    return this.operationsSum;
  }
}
