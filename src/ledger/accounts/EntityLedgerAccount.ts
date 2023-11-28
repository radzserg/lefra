import { LedgerAccount } from './LedgerAccount.js';
import { LedgerAccountError } from '@/errors.js';
import { SYSTEM_PREFIX } from '@/ledger/accounts/SystemLedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

/**
 * Represents accounts belonging to some entity - user, company, etc.
 */
export class EntityLedgerAccount extends LedgerAccount {
  public constructor(
    public readonly name: string,
    public readonly entityId: EXTERNAL_ID,
    public readonly prefix: string = 'ENTITY',
  ) {
    super();

    this.validateName(name);
    this.validateName(prefix);
    if (prefix === SYSTEM_PREFIX) {
      throw new LedgerAccountError('Prefix SYSTEM is reserved');
    }
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.fullName()}:${this.entityId}`;
  }

  private fullName() {
    return `${this.prefix}_${this.name.toUpperCase()}`;
  }

  public toJSON() {
    return {
      entityId: this.entityId,
      id: this.id,
      name: this.fullName(),
    };
  }
}
