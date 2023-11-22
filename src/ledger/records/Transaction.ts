import { Entry } from "./Entry";
import { v4 as uuid } from "uuid";

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly id: string = uuid();

  public constructor(
    public readonly entries: Entry[],
    public readonly description: string | null = null,
  ) {}
}
