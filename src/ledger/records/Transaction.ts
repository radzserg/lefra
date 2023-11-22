import { Entry } from "./Entry";
import { v4 as uuid } from "uuid";
import { OperationType } from "../../types";
import { Operation } from "./Operations";

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly id: string = uuid();
  private readonly _operations: Operation[];

  public constructor(
    entries: Entry[],
    public readonly description: string | null = null,
  ) {
    const operations: Operation[] = [];
    for (const entry of entries) {
      operations.push(...entry.debitOperations(), ...entry.creditOperations());
    }

    operations.map((operation) => {
      operation.setTransactionId(this.id);
    });

    this._operations = operations;
  }

  public operations(): Operation[] {
    return this._operations;
  }
}
