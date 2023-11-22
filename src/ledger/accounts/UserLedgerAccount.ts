import { LedgerAccount } from "./LedgerAccount";

/**
 * Represents user-defined ledger account. Defined by name and id.
 */
export class UserLedgerAccount extends LedgerAccount {
  public canBeInserted = true;

  public constructor(
    private readonly ledgerId: string,
    private readonly name: string,
    private readonly ledgerAccountId: number,
  ) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.ledgerId}:${this.name}:${this.ledgerAccountId}`;
  }
}
