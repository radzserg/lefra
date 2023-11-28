import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { EXTERNAL_ID } from '@/types.js';

export class UserLedgerAccount extends EntityLedgerAccount {
  public constructor(name: string, entityId: EXTERNAL_ID) {
    super(name, entityId, 'USER');
  }
}
