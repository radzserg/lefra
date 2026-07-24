import { LedgerAccountRef } from '../accounts/LedgerAccountRef.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

export type CreditEntry<C extends UnitCode> = CoreEntry<'CREDIT', C> & {
  action: 'CREDIT';
};

export type DebitEntry<C extends UnitCode> = CoreEntry<'DEBIT', C> & {
  action: 'DEBIT';
};

export type Entry<C extends UnitCode = UnitCode> =
  CreditEntry<C> | DebitEntry<C>;

type CoreEntry<A extends 'CREDIT' | 'DEBIT', C extends UnitCode> = {
  account: LedgerAccountRef;
  action: A;
  amount: Unit<C>;
  mayHaveZero: () => A extends 'DEBIT' ? DebitEntry<C> : CreditEntry<C>;
  validate: () => void;
};

class LedgerEntry<A extends 'CREDIT' | 'DEBIT', C extends UnitCode> {
  private zeroable = false;

  public constructor(
    public readonly action: A,
    public readonly account: LedgerAccountRef,
    public readonly amount: Unit<C>,
  ) {}

  public mayHaveZero(): A extends 'DEBIT' ? DebitEntry<C> : CreditEntry<C> {
    this.zeroable = true;
    return this as unknown as A extends 'DEBIT'
      ? DebitEntry<C>
      : CreditEntry<C>;
  }

  public validate() {
    if (this.zeroable) {
      return;
    }

    if (this.amount.isZero()) {
      throw new Error('Cannot create entry with zero amount');
    }
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
