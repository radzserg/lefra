import {
  CreditOperation,
  DebitOperation,
  UniformOperationsSet,
} from "./Operations";

/**
 * Represents double-entry bookkeeping entry.
 */
export class Entry {
  private debitOperations: UniformOperationsSet[];
  public constructor(
    debitOperations: DebitOperation | DebitOperation[],
    creditOperations: CreditOperation | CreditOperation[],
    private readonly comment?: string,
  ) {}
}
