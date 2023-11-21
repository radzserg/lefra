import { DebitOperation } from "./DebitOperation";
import { CreditOperation } from "./CreditOperation";

export type OperationType = "DEBIT" | "CREDIT";

/**
 * Represents double-entry bookkeeping entry.
 */
export class Entry {
  public constructor(
    private readonly debit: DebitOperation | DebitOperations,
    private readonly credit: CreditOperation | CreditOperations,
    private readonly comment?: string,
  ) {}
}

export class DebitOperations {
  public constructor(private readonly operations: DebitOperations[]) {}
}

export class CreditOperations {
  public constructor(private readonly operations: CreditOperation[]) {}
}
