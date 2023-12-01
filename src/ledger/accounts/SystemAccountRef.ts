import {
  ACCOUNT_NAME_SEPARATOR,
  LedgerAccountRef,
  SYSTEM_ACCOUNT_PREFIX,
} from '@/ledger/accounts/LedgerAccountRef.js';
import { DB_ID } from '@/types.js';

export class SystemAccountRef extends LedgerAccountRef {
  public readonly type = 'SYSTEM' as const;

  public constructor(
    public readonly ledgerId: DB_ID,
    name: string,
    prefix: string = SYSTEM_ACCOUNT_PREFIX,
  ) {
    LedgerAccountRef.validateName(name);
    LedgerAccountRef.validatePrefix(prefix);

    const slug = `${prefix}${ACCOUNT_NAME_SEPARATOR}${name}`;
    super(ledgerId, slug);
  }
}
