import { entityAccount } from '@/ledger/accounts/LedgerAccount.js';
import { DB_ID } from '@/types.js';

export const userAccount = (name: string, entityId: DB_ID) => {
  return entityAccount(name, entityId, 'USER');
};
