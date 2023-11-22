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
  private readonly _debitOperations: UniformOperationsSet<DebitOperation>;
  private readonly _creditOperations: UniformOperationsSet<CreditOperation>;

  public constructor(
    debitOperations: DebitOperation | NonEmptyArray<DebitOperation>,
    creditOperations: CreditOperation | NonEmptyArray<CreditOperation>,
    public readonly comment: string | null = null,
  ) {
    this._debitOperations = UniformOperationsSet.build(debitOperations);
    this._creditOperations = UniformOperationsSet.build(creditOperations);

    const debitSum = this._debitOperations.sum();
    const creditSum = this._creditOperations.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }
  }

  public get debitOperations(): NonEmptyArray<DebitOperation> {
    return this._debitOperations.operations();
  }

  public get creditOperations(): NonEmptyArray<CreditOperation> {
    return this._creditOperations.operations();
  }
}
