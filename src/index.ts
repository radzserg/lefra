import { EntityLedgerAccount } from './ledger/accounts/EntityLedgerAccount.js';
import { SystemLedgerAccount } from './ledger/accounts/SystemLedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

/**
 * Shorthand to create ledger account
 */
export const account = (name: string, id?: EXTERNAL_ID) => {
  if (id) {
    return new EntityLedgerAccount(name, id);
  }

  return new SystemLedgerAccount(name);
};
