import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { UserLedgerAccount } from '#/customLedger/accounts/UserLedgerAccount.js';

// this will be automatically generated
type UserLedgerAccountType = 'RECEIVABLES' | 'PAYABLE_LOCKED' | 'PAYABLE';
type SystemAccountType =
  | 'INCOME_PAID_PROJECTS'
  | 'INCOME_PAYMENT_FEE'
  | 'INCOME_CONTRACT_FEES'
  | 'EXPENSES_PAYOUTS';

export const userAccount = (
  name: UserLedgerAccountType,
  userAccountId: number,
) => {
  return new UserLedgerAccount(name, userAccountId);
};

export const systemAccount = (name: SystemAccountType) => {
  return new SystemLedgerAccount(name);
};
