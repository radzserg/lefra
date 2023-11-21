import {
  CreditOperation,
  DebitOperation,
  UniformOperationsSet,
} from "./Operations";
import { NonEmptyArray } from "../../types";
import { LedgerError } from "../../errors";

/**
 * Represents double-entry bookkeeping entry.
 */
export class Entry {
  private debitOperations: UniformOperationsSet<DebitOperation>;
  private creditOperations: UniformOperationsSet<CreditOperation>;

  public constructor(
    debitOperations: DebitOperation | NonEmptyArray<DebitOperation>,
    creditOperations: CreditOperation | NonEmptyArray<CreditOperation>,
    private readonly comment?: string,
  ) {
    this.debitOperations = UniformOperationsSet.build(debitOperations);
    this.creditOperations = UniformOperationsSet.build(creditOperations);

    const debitSum = this.debitOperations.sum();
    const creditSum = this.creditOperations.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }
  }
}
