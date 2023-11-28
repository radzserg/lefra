import { Transaction } from '../records/Transaction.js';
import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { Money } from '@/money/Money.js';
import { DB_ID } from '@/types.js';

export type LedgerStorage = {
  fetchAccountBalance: (
    ledgerId: DB_ID,
    account: LedgerAccount,
  ) => Promise<Money | null>;

  insertTransaction: (
    ledgerId: DB_ID,
    transaction: Transaction,
  ) => Promise<void>;
};
