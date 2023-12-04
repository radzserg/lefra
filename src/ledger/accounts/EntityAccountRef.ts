import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { DB_ID } from '@/types.js';

/**
 * Represents a reference to an account associated with an entity. Those accounts
 * are created dynamically and are not preset.
 *
 * Hint: prefix the name with the entity type to avoid name collisions.
 * For example, USER_RECEIVABLES, TEAM_LOCKED_FUNDS, etc.
 */
export class EntityAccountRef extends LedgerAccountRef {
  public readonly type = 'ENTITY' as const;

  public readonly name: string;

  public constructor(
    public readonly ledgerId: DB_ID,
    name: string,
    public readonly externalId: DB_ID,
  ) {
    LedgerAccountRef.validateName(name);

    const slug = `${name}:${externalId}`;
    super(ledgerId, slug);
    this.name = name;
  }
}
