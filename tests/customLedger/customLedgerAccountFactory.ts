import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DB_ID } from '@/types.js';
import {
  CustomLedgerEntityAccounts,
  CustomLedgerSystemAccounts,
} from '#/customLedger/buildCustomLedger.js';

export const customLedgerAccountFactory = (ledgerId: DB_ID) => {
  return {
    systemAccount: (name: CustomLedgerSystemAccounts) => {
      return new SystemAccountRef(ledgerId, 'SYSTEM_' + name);
    },
    teamAccount: (name: CustomLedgerEntityAccounts, teamId: string) => {
      return new EntityAccountRef(ledgerId, name, teamId);
    },
    userAccount: (name: CustomLedgerEntityAccounts, userAccountId: number) => {
      return new EntityAccountRef(ledgerId, `USER_` + name, userAccountId);
    },
  };
};
