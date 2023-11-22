import { Transaction } from "../records/Transaction";

export interface LedgerStorage {
  saveTransaction(transaction: Transaction): Promise<void>;
}
