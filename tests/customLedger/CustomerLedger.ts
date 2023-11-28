import {
  entityAccount,
  systemAccount as defaultSystemAccount,
} from '@/ledger/accounts/LedgerAccount.js';

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
  return entityAccount(name, userAccountId, 'USER');
};

export const systemAccount = (name: SystemAccountType) => {
  return defaultSystemAccount(name);
};
