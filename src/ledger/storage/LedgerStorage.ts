import { Transaction } from '../records/Transaction.js';

export type LedgerStorage = {
  insertTransaction: (transaction: Transaction) => Promise<void>;
};
