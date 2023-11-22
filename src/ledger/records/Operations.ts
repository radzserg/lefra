import { LedgerAccount } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";
import { CurrencyCode } from "../../money/currencies";
import { NonEmptyArray, OperationType } from "../../types";
import { v4 as uuid } from "uuid";

export abstract class Operation {
  public abstract readonly type: OperationType;
  public readonly id: string = uuid();
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
      throw new LedgerError("Operation is already attached to a transaction");
    }

    this._transactionId = transactionId;
  }

  public set accountId(accountId: string) {
    if (this._accountId !== null) {
      throw new LedgerError("Account is already attached to an operation");
    }

    this._accountId = accountId;
  }

  public get accountId(): string | null {
    return this._accountId;
  }

  public toJSON() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      accountId: this.accountId,
      account: this.account,
      amount: this.amount,
    };
  }
}

export class CreditOperation extends Operation {
  public readonly type: OperationType = "CREDIT";
}

export class DebitOperation extends Operation {
  public readonly type: OperationType = "DEBIT";
}

export const credit = (
  account: LedgerAccount,
  amount: Money,
): CreditOperation => {
  return new CreditOperation(account, amount);
};

export const debit = (
  account: LedgerAccount,
  amount: Money,
): DebitOperation => {
  return new DebitOperation(account, amount);
};

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class UniformOperationsSet<O extends DebitOperation | CreditOperation> {
  private readonly type: OperationType;
  private readonly currencyCode: CurrencyCode;
  private readonly operationsSum: Money;

  private constructor(private readonly operationList: NonEmptyArray<O>) {
    if (Array.isArray(this.operationList)) {
      if (this.operationList.length === 0) {
        throw new LedgerError("Operations array must not be empty");
      }
    }

    this.type = this.operationList[0].type;
    this.currencyCode = this.operationList[0].amount.currencyCode;

    let sum = new Money(0, this.currencyCode);
    this.operationList.forEach((operation) => {
      if (operation.type !== this.type) {
        throw new LedgerError("All operations must be of the same type");
      }
      if (operation.amount.currencyCode !== this.currencyCode) {
        throw new LedgerError("All operations must be of the same currency");
      }
      sum = sum.plus(operation.amount);
    });

    if (sum.isZero()) {
      throw new LedgerError("Operations must not sum to zero");
    }
    this.operationsSum = sum;
  }

  public static build(
    operations:
      | DebitOperation
      | NonEmptyArray<DebitOperation>
      | CreditOperation
      | NonEmptyArray<CreditOperation>,
  ) {
    let operationList: NonEmptyArray<DebitOperation | CreditOperation>;
    if (operations instanceof DebitOperation) {
      operationList = [operations];
    } else if (operations instanceof CreditOperation) {
      operationList = [operations];
    } else {
      operationList = operations;
    }
    return new UniformOperationsSet(operationList);
  }

  public operations(): NonEmptyArray<O> {
    return this.operationList;
  }

  public sum(): Money {
    return this.operationsSum;
  }
}
