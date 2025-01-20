import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { type DB_ID } from '@/types.js';

/**
 * Represents a reference to an account associated with an entity. Those accounts
 * are created dynamically and are not preset.
 *
 * Hint: prefix the name with the entity type to avoid name collisions.
 * For example, USER_RECEIVABLES, TEAM_LOCKED_FUNDS, etc.
 */
export class EntityAccountRef extends LedgerAccountRef {
  public readonly name: string;

  public readonly type = 'ENTITY' as const;

  public constructor(
    public readonly ledgerSlug: string,
    name: string,
    public readonly externalId: DB_ID,
  ) {
    LedgerAccountRef.validateName(name);

    const accountSlug = `${name}:${externalId}`;
    super(ledgerSlug, accountSlug);
    this.name = name;
  }
}
