import { UserLedgerAccount } from '#/customLedger/accounts/UserLedgerAccount.js';

export const userAccount = (name: string, userAccountId: number) => {
  return new UserLedgerAccount(name, userAccountId);
};
