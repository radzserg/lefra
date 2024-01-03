import { LedgerError, LedgerUnexpectedError } from '@/errors.js';
import { CreditEntry, DebitEntry } from '@/ledger/transaction/Entry.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { EntryAction, ExtractUnitCode, NonEmptyArray } from '@/types.js';
import { isNonEmptyArray } from '@/utils.js';

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class EntriesWithSameAction<
  O extends DebitEntry<UnitCode> | CreditEntry<UnitCode>,
> {
  private readonly action: EntryAction;

  private readonly operationsSum: Unit<ExtractUnitCode<O>>;

  public readonly entries: NonEmptyArray<O>;

  private constructor(entries: NonEmptyArray<O>) {
    // validate all entries
    for (const entry of entries) {
      entry.validate();
    }

    const notNullEntries = entries.filter((entry) => !entry.amount.isZero());

    if (Array.isArray(notNullEntries) && notNullEntries.length === 0) {
      throw new LedgerError('Operations array must not be empty');
    }

    if (!isNonEmptyArray(notNullEntries)) {
      throw new LedgerUnexpectedError('Double entries is empty array');
    }

    this.action = notNullEntries[0].action;
    let sum = notNullEntries[0].amount.zeroValue();
    for (const operation of notNullEntries) {
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

    this.entries = notNullEntries;
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

  public sum(): Unit<ExtractUnitCode<O>> {
    return this.operationsSum;
  }
}
