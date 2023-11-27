import { LedgerOperation } from "./operation/LedgerOperation.js";
import { LedgerStorage } from "./storage/LedgerStorage.js";
import { Transaction } from "./records/Transaction.js";

type LedgerOperationData = {
  type: string; // unique operation type for a given ledger ID
};

export class Ledger {
  public constructor(
    private readonly id: string,
    private readonly storage: LedgerStorage,
  ) {}

  public async record(operation: LedgerOperation<any>): Promise<Transaction> {
    // create operation from operation data
    // const transaction = await operation.createTransaction(operation);
    // await this.storage.insertTransaction(transaction);
    // return transaction;
    throw new Error("Not implemented");
  }
}
