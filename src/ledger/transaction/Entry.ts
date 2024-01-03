import { LedgerAccountRef } from '../accounts/LedgerAccountRef.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

type CoreEntry<A extends 'DEBIT' | 'CREDIT', C extends UnitCode> = {
  account: LedgerAccountRef;
  action: A;
  amount: Unit<C>;
  nullable: () => A extends 'DEBIT' ? DebitEntry<C> : CreditEntry<C>;
  validate: () => void;
};

export type CreditEntry<C extends UnitCode> = {
  action: 'CREDIT';
} & CoreEntry<'CREDIT', C>;

export type DebitEntry<C extends UnitCode> = {
  action: 'DEBIT';
} & CoreEntry<'DEBIT', C>;

export type Entry<C extends UnitCode = UnitCode> =
  | CreditEntry<C>
  | DebitEntry<C>;

class LedgerEntry<A extends 'DEBIT' | 'CREDIT', C extends UnitCode> {
  private isNullable = false;

  public constructor(
    public readonly action: A,
    public readonly account: LedgerAccountRef,
    public readonly amount: Unit<C>,
  ) {}

  public validate() {
    if (this.isNullable) {
      return;
    }

    if (this.amount.isZero()) {
      throw new Error('Cannot create entry with zero amount');
    }
  }

  public nullable(): A extends 'DEBIT' ? DebitEntry<C> : CreditEntry<C> {
    this.isNullable = true;
    return this as unknown as A extends 'DEBIT'
      ? DebitEntry<C>
      : CreditEntry<C>;
  }
}

export const credit = <C extends UnitCode>(
  account: LedgerAccountRef,
  amount: Unit<C>,
): CreditEntry<C> => {
  return new LedgerEntry('CREDIT', account, amount) as CreditEntry<C>;
};

export const debit = <C extends UnitCode>(
  account: LedgerAccountRef,
  amount: Unit<C>,
): DebitEntry<C> => {
  return new LedgerEntry('DEBIT', account, amount) as DebitEntry<C>;
};
