import { Transaction } from '../../src/ledger/records/Transaction.js';
import { LedgerStorage } from '../../src/ledger/storage/LedgerStorage.js';
import {
  ProjectStartedOperation,
  ProjectStartedOperationData,
} from './operations/ProjectStartedOperation.js';

export class CustomLedger {
  public constructor(
    private readonly id: string,
    private readonly storage: LedgerStorage,
  ) {}

  public async record(data: ProjectStartedOperationData): Promise<Transaction> {
    const operation = new ProjectStartedOperation(this.id, data);

    const transaction = await operation.createTransaction();
    await this.storage.insertTransaction(transaction);
    return transaction;
  }
}
