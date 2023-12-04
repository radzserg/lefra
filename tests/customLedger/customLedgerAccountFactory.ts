import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID } from '@/types.js';
import {
  CustomLedgerEntityAccountTypes,
  CustomLedgerSystemAccounts,
} from '#/customLedger/buildCustomLedger.js';

export const customLedgerAccountFactory = (ledgerId: DB_ID) => {
  return {
    systemAccount: (name: CustomLedgerSystemAccounts) => {
      return new SystemAccountRef(ledgerId, name);
    },
    // teamAccount: (name: CustomLedgerEntityAccounts, teamId: string) => {
    //   return new EntityAccountRef(ledgerId, name, teamId);
    // },
    userAccount: (
      name: CustomLedgerEntityAccountTypes,
      userAccountId: number,
    ) => {
      return new EntityAccountRef(ledgerId, name, userAccountId);
    },
  };
};

// export type LedgerSpec = {
//   entityAccountTypes: NonEmptyArray<string>;
//   systemAccounts: NonEmptyArray<string>;
// };

type CustomLedgerSpec = {
  entityAccountTypes: [''];
  systemAccounts: [
    'SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA',
    'SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES',
    'SYSTEM_EXPENSES_PAYOUTS',
    'SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES',
    'SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES',
    'SYSTEM_INCOME_CONTRACT_FEES',
    'SYSTEM_INCOME_CURRENCY_CONVERSION_GAINS',
    'SYSTEM_INCOME_PAID_PROJECTS',
    'SYSTEM_INCOME_PAYMENT_FEE',
    'SYSTEM_INCOME_STRIPE_PAY_IN_FEES',
  ];
};
