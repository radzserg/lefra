import { LedgerAccount } from './LedgerAccount.js';

export const SYSTEM_PREFIX = 'SYSTEM';

export class SystemLedgerAccount extends LedgerAccount {
  private readonly prefix: string = SYSTEM_PREFIX;

  public constructor(public readonly name: string) {
    super();
    this.validateName(name);
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.fullName()}`;
  }

  private fullName() {
    return `${this.prefix}_${this.name.toUpperCase()}`;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.fullName(),
    };
  }
}
