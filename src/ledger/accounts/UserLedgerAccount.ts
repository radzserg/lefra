import { LedgerAccount } from "./LedgerAccount";

/**
 * Represents user-defined ledger account. Defined by name and id.
 */
export class UserLedgerAccount implements LedgerAccount {
  public constructor(
    private readonly ledgerId: string,
    private readonly name: string,
    private readonly ledgerAccountId: number,
  ) {}

  public get uniqueNameIdentifier(): string {
    return `${this.ledgerId}:${this.name}:${this.ledgerAccountId}`;
  }
}
