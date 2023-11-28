import { LedgerAccount } from './LedgerAccount.js';

export const SYSTEM_PREFIX = 'SYSTEM';

export class SystemLedgerAccount extends LedgerAccount {
  public readonly name: string;

  public constructor(name: string, prefix: string = SYSTEM_PREFIX) {
    super();
    this.validateName(name);
    this.name = `${prefix}_${name}`;
  }

  public get uniqueNamedIdentifier(): string {
    return this.name;
  }
}
