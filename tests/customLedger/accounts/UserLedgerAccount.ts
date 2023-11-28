import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';

export class UserLedgerAccount extends EntityLedgerAccount {
  public constructor(
    public readonly name: string,
    public readonly entityId: string,
  ) {
    super(name, entityId, 'USER');
  }
}
