import { Transaction } from "../records/Transaction";

export interface LedgerStorage {
  insertTransaction(transaction: Transaction): Promise<void>;
}
