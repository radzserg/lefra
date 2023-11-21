import { LedgerAccount } from "../accounts/LedgerAccount";
import { OperationType } from "./Entry";
import { Money } from "../../money/Money";

export class CreditOperation {
  private readonly type: OperationType = "CREDIT";
  public constructor(
    private readonly account: LedgerAccount,
    private readonly amount: Money,
  ) {}
}

export const credit = (
  account: LedgerAccount,
  amount: Money,
): CreditOperation => {
  return new CreditOperation(account, amount);
};
