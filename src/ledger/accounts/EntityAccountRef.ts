import { LedgerAccountError } from '@/errors.js';
import {
  ACCOUNT_NAME_SEPARATOR,
  LedgerAccountRef,
  SYSTEM_ACCOUNT_PREFIX,
} from '@/ledger/accounts/LedgerAccountRef.js';
import { DB_ID } from '@/types.js';

const ENTITY_ACCOUNT_PREFIX = 'ENTITY';

/**
 * Represents a reference to an account associated with an entity. Those accounts
 * are created dynamically and are not preset.
 */
export class EntityAccountRef extends LedgerAccountRef {
  public readonly type = 'ENTITY' as const;

  public readonly name: string;

  public constructor(
    public readonly ledgerId: DB_ID,
    name: string,
    public readonly externalId: DB_ID,
    prefix: string = ENTITY_ACCOUNT_PREFIX,
  ) {
    LedgerAccountRef.validatePrefix(prefix);
    if (prefix === SYSTEM_ACCOUNT_PREFIX) {
      throw new LedgerAccountError(
        `Prefix ${SYSTEM_ACCOUNT_PREFIX} is reserved`,
      );
    }

    LedgerAccountRef.validateName(name);

    const slug = `${prefix}${ACCOUNT_NAME_SEPARATOR}${name}:${externalId}`;
    super(ledgerId, slug);
    this.name = `${prefix}_${name}`;
  }
}
