import { LedgerAccount } from "./LedgerAccount";

/**
 * Represents user-defined ledger account. Defined by name and id.
 */
export class UserLedgerAccount extends LedgerAccount {
  public canBeInserted = true;

  public constructor(
    private readonly name: string,
    private readonly userAccountId: number,
  ) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.name}:${this.userAccountId}`;
  }
}
