import { LedgerOperation } from "./operation/LedgerOperation";
import { LedgerStorage } from "./storage/LedgerStorage";
import { Transaction } from "./records/Transaction";

export class Ledger {
  public constructor(private readonly storage: LedgerStorage) {}

  public async record(operation: LedgerOperation): Promise<Transaction> {
    const transaction = await operation.createTransaction();
    await this.storage.insertTransaction(transaction);
    return transaction;
  }
}
