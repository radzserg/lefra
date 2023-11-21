import { LedgerAccount } from "../accounts/LedgerAccount";
import { OperationType } from "./Entry";
import { Money } from "../../money/Money";

export class DebitOperation {
  private readonly type: OperationType = "DEBIT";
  public constructor(
    private readonly account: LedgerAccount,
    private readonly amount: Money,
  ) {}
}

export const debit = (
  account: LedgerAccount,
  amount: Money,
): DebitOperation => {
  return new DebitOperation(account, amount);
};
