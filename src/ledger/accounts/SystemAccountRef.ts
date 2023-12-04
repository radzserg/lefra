import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { DB_ID } from '@/types.js';

/**
 * Represents a reference to a  system ledger account.
 * System accounts must be preset.
 *
 * Hint: prefix the name with SYSTEM_ to avoid name collisions with entity accounts.
 */
export class SystemAccountRef extends LedgerAccountRef {
  public readonly type = 'SYSTEM' as const;

  public constructor(
    public readonly ledgerId: DB_ID,
    slug: string,
  ) {
    LedgerAccountRef.validateName(slug);
    super(ledgerId, slug);
  }
}
