import { LedgerAccount } from './LedgerAccount.js';

export class SystemLedgerAccount extends LedgerAccount {
  public constructor(public readonly name: string) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `SYSTEM_${this.name.toUpperCase()}`;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
