import { LedgerAccount } from '../accounts/LedgerAccount.js';
import { LedgerError } from '@/errors.js';
import { Money } from '@/money/Money.js';
import { EntryAction } from '@/types.js';

export abstract class Entry {
  public abstract readonly action: EntryAction;

  private _transactionId: string | null = null;

  private _accountId: string | null = null;

  public constructor(
    public readonly account: LedgerAccount,
    public readonly amount: Money,
  ) {}

  public get transactionId(): string | null {
    return this._transactionId;
  }

  public set transactionId(transactionId: string) {
    if (this._transactionId !== null) {
      throw new LedgerError('Operation is already attached to a transaction');
    }

    // eslint-disable-next-line canonical/id-match
    this._transactionId = transactionId;
  }

  public get accountId(): string | null {
    return this._accountId;
  }

  public set accountId(accountId: string) {
    if (this._accountId !== null) {
      throw new LedgerError('Account is already attached to an operation');
    }

    // eslint-disable-next-line canonical/id-match
    this._accountId = accountId;
  }
}

export class CreditEntry extends Entry {
  public readonly action: EntryAction = 'CREDIT';
}

export class DebitEntry extends Entry {
  public readonly action: EntryAction = 'DEBIT';
}

export const credit = (account: LedgerAccount, amount: Money): CreditEntry => {
  return new CreditEntry(account, amount);
};

export const debit = (account: LedgerAccount, amount: Money): DebitEntry => {
  return new DebitEntry(account, amount);
};
