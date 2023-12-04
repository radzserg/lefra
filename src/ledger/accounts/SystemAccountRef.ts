import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';

/**
 * Represents a reference to a  system ledger account.
 * System accounts must be preset.
 *
 * Hint: prefix the name with SYSTEM_ to avoid name collisions with entity accounts.
 */
export class SystemAccountRef extends LedgerAccountRef {
  public readonly type = 'SYSTEM' as const;

  public constructor(
    public readonly ledgerSlug: string,
    accountSlug: string,
  ) {
    LedgerAccountRef.validateName(accountSlug);
    super(ledgerSlug, accountSlug);
  }
}
