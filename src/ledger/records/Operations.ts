import { LedgerAccount } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";
import { CurrencyCode } from "../../money/currencies";

export type OperationType = "DEBIT" | "CREDIT";

export interface Operation {
  type: OperationType;
  account: LedgerAccount;
  amount: Money;
}

export class CreditOperation implements Operation {
  public readonly type: OperationType = "CREDIT";
  public constructor(
    public readonly account: LedgerAccount,
    public readonly amount: Money,
  ) {}
}

export class DebitOperation implements Operation {
  public readonly type: OperationType = "DEBIT";
  public constructor(
    public readonly account: LedgerAccount,
    public readonly amount: Money,
  ) {}
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

type NonEmptyArray<T> = [T, ...T[]];

/**
 * List of operations of the same type. Either all debit or all credit.
 * All money amounts must be of the same currency.
 */
export class UniformOperationsSet {
  private readonly operationList: DebitOperation[] | CreditOperation[];

  private readonly type: OperationType;
  private readonly currencyCode: CurrencyCode;
  private readonly operationsSum: Money;

  public constructor(
    operations:
      | DebitOperation
      | NonEmptyArray<DebitOperation>
      | CreditOperation
      | NonEmptyArray<CreditOperation>,
  ) {
    if (Array.isArray(operations)) {
      if (operations.length === 0) {
        throw new LedgerError("Operations array must not be empty");
      }
    }

    if (operations instanceof DebitOperation) {
      this.operationList = [operations];
    } else if (operations instanceof CreditOperation) {
      this.operationList = [operations];
    } else {
      this.operationList = operations;
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

  public operations(): DebitOperation[] | CreditOperation[] {
    return this.operationList;
  }

  public sum(): Money {
    return this.operationsSum;
  }
}
