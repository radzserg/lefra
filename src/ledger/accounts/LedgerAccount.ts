import { v4 as uuid } from "uuid";


export abstract class LedgerAccount {
  public readonly id: string = uuid();

  /**
   * Unique named identifier of this account.
   */
  public abstract get uniqueNamedIdentifier(): string;

  /**
   * Indicates whether this account can be inserted into the database.
   */
  public abstract canBeInserted: boolean;
}
