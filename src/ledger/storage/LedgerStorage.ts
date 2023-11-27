import { Transaction } from "../records/Transaction.js";

export interface LedgerStorage {
  insertTransaction(transaction: Transaction): Promise<void>;
}
