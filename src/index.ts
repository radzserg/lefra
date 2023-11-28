import { SystemLedgerAccount } from './ledger/accounts/SystemLedgerAccount.js';
import { UserLedgerAccount } from './ledger/accounts/UserLedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

/**
 * Shorthand to create ledger account
 */
export const account = (name: string, id?: EXTERNAL_ID) => {
  if (id) {
    return new UserLedgerAccount(name, id);
  }

  return new SystemLedgerAccount(name);
};
