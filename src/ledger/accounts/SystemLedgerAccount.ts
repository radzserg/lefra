import { LedgerAccount } from "./LedgerAccount";

export class SystemLedgerAccount extends LedgerAccount {
  public canBeInserted = false;

  public constructor(
    private readonly ledgerId: string,
    private readonly name: string,
  ) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.ledgerId}:${this.name}`;
  }
}
