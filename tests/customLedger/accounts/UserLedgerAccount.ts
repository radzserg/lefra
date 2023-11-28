import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { DB_ID } from '@/types.js';

export class UserLedgerAccount extends EntityLedgerAccount {
  public constructor(name: string, entityId: DB_ID) {
    super(name, entityId, 'USER');
  }
}
