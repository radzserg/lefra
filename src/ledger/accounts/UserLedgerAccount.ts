import { LedgerAccount } from './LedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

/**
 * Represents user-defined ledger account. Defined by name and id.
 */
export class UserLedgerAccount extends LedgerAccount {
  public constructor(
    public readonly name: string,
    public readonly userAccountId: EXTERNAL_ID,
  ) {
    super();
  }

  public get uniqueNamedIdentifier(): string {
    return `USER_${this.name.toUpperCase()}:${this.userAccountId}`;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      userAccountId: this.userAccountId,
    };
  }
}
