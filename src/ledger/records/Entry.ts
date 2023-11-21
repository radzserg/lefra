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
  private readonly debitOperationSet: UniformOperationsSet<DebitOperation>;
  private readonly creditOperationSet: UniformOperationsSet<CreditOperation>;

  public constructor(
    debitOperations: DebitOperation | NonEmptyArray<DebitOperation>,
    creditOperations: CreditOperation | NonEmptyArray<CreditOperation>,
    public readonly comment: string | null = null,
  ) {
    this.debitOperationSet = UniformOperationsSet.build(debitOperations);
    this.creditOperationSet = UniformOperationsSet.build(creditOperations);

    const debitSum = this.debitOperationSet.sum();
    const creditSum = this.creditOperationSet.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }
  }

  public debitOperations(): NonEmptyArray<DebitOperation> {
    return this.debitOperationSet.operations();
  }

  public creditOperations(): NonEmptyArray<CreditOperation> {
    return this.creditOperationSet.operations();
  }
}
