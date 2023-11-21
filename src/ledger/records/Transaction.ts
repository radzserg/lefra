import { Entry } from "./Entry";

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public constructor(
    private readonly entries: Entry[],
    private readonly description: string | null = null,
  ) {}
}
