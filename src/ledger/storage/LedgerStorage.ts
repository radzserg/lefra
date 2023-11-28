import { Transaction } from '../records/Transaction.js';
import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { Money } from '@/money/Money.js';

export type LedgerStorage = {
  fetchAccountBalance: (account: LedgerAccount) => Promise<Money>;

  insertTransaction: (transaction: Transaction) => Promise<void>;
};
