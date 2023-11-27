import { LedgerAccount } from "./LedgerAccount.js";

export class SystemLedgerAccount extends LedgerAccount {
  public canBeInserted = false;

  public constructor(public readonly name: string) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `SYSTEM_${this.name}`;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
