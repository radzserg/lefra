import { SystemLedgerAccount } from './ledger/accounts/SystemLedgerAccount.js';
import { UserLedgerAccount } from './ledger/accounts/UserLedgerAccount.js';

/**
 * Shorthand to create ledger account
 */
export const account = (name: string, id?: number | string) => {
  if (id) {
    return new UserLedgerAccount(name, id);
  }

  return new SystemLedgerAccount(name);
};
