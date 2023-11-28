import { LedgerError } from '@/errors.js';
import { CreditEntry, DebitEntry } from '@/ledger/records/Entry.js';
import { CurrencyCode } from '@/money/currencies.js';
import { Money } from '@/money/Money.js';
import { EntryAction, NonEmptyArray } from '@/types.js';

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class UniformEntrySet<O extends DebitEntry | CreditEntry> {
  private readonly type: EntryAction;

  private readonly currencyCode: CurrencyCode;

  private readonly operationsSum: Money;

  private constructor(private readonly operationList: NonEmptyArray<O>) {
    if (Array.isArray(this.operationList) && this.operationList.length === 0) {
      throw new LedgerError('Operations array must not be empty');
    }

    this.type = this.operationList[0].action;
    this.currencyCode = this.operationList[0].amount.currencyCode;

    let sum = new Money(0, this.currencyCode);
    for (const operation of this.operationList) {
      if (operation.action !== this.type) {
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

  public static build(
    entries:
      | DebitEntry
      | NonEmptyArray<DebitEntry>
      | CreditEntry
      | NonEmptyArray<CreditEntry>,
  ) {
    let entriesList: NonEmptyArray<DebitEntry | CreditEntry>;
    if (entries instanceof DebitEntry) {
      entriesList = [entries];
    } else if (entries instanceof CreditEntry) {
      entriesList = [entries];
    } else {
      entriesList = entries;
    }

    return new UniformEntrySet(entriesList);
  }

  public entries(): NonEmptyArray<O> {
    return this.operationList;
  }

  public sum(): Money {
    return this.operationsSum;
  }
}
