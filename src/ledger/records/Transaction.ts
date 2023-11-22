import { DoubleEntry } from "./DoubleEntry";
import { v4 as uuid } from "uuid";
import { Entry } from "./Entry";

/**
 * Represents a transaction in the ledger.
 * Transaction is a set of entries that are applied atomically.
 */
export class Transaction {
  public readonly id: string = uuid();
  private readonly _entries: Entry[];

  public constructor(
    entries: DoubleEntry[],
    public readonly description: string | null = null,
  ) {
    this._entries = [];
    for (const entry of entries) {
      this._entries.push(...entry.debitEntries, ...entry.creditEntries);
    }

    this._entries.map((entry) => {
      entry.transactionId = this.id;
    });
  }

  public get entries(): Entry[] {
    return this._entries;
  }
}
