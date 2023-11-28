import { LedgerAccount } from './LedgerAccount.js';
import { LedgerAccountError } from '@/errors.js';
import { SYSTEM_PREFIX } from '@/ledger/accounts/SystemLedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

/**
 * Represents accounts belonging to some entity - user, company, etc.
 */
export class EntityLedgerAccount extends LedgerAccount {
  public readonly name: string;

  public constructor(
    name: string,
    public readonly entityId: EXTERNAL_ID,
    prefix: string = 'ENTITY',
  ) {
    super();

    this.validateName(name);
    this.validateName(prefix);

    this.name = `${prefix}_${name}`;
    if (prefix === SYSTEM_PREFIX) {
      throw new LedgerAccountError('Prefix SYSTEM is reserved');
    }
  }

  public get uniqueNamedIdentifier(): string {
    return `${this.name}:${this.entityId}`;
  }

  public toJSON() {
    return {
      entityId: this.entityId,
      id: this.id,
      name: this.name,
    };
  }
}
