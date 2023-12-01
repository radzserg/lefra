import { LedgerAccountError } from '@/errors.js';
import {
  ACCOUNT_NAME_SEPARATOR,
  LedgerAccountRef,
  SYSTEM_ACCOUNT_PREFIX,
} from '@/ledger/accounts/LedgerAccountRef.js';
import { DB_ID } from '@/types.js';

const ENTITY_ACCOUNT_PREFIX = 'ENTITY';

export class EntityAccountRef extends LedgerAccountRef {
  public readonly type = 'ENTITY' as const;

  public constructor(
    public readonly ledgerId: DB_ID,
    public readonly name: string,
    public readonly externalId: DB_ID,
    prefix: string = ENTITY_ACCOUNT_PREFIX,
  ) {
    LedgerAccountRef.validateName(name);
    LedgerAccountRef.validatePrefix(prefix);
    if (prefix === SYSTEM_ACCOUNT_PREFIX) {
      throw new LedgerAccountError(
        `Prefix ${SYSTEM_ACCOUNT_PREFIX} is reserved`,
      );
    }

    const slug = `${prefix}${ACCOUNT_NAME_SEPARATOR}${name}:${externalId}`;
    super(ledgerId, slug);
  }
}
