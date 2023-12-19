import { Transaction } from '../transaction/Transaction.js';

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export type ILedgerOperation = {
  createTransaction: () => Promise<Transaction>;
};
