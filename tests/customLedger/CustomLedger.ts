import {
  ProjectStartedOperation,
  ProjectStartedOperationData,
} from './operations/ProjectStartedOperation.js';
import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { Transaction } from '@/ledger/records/Transaction.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';

type LedgerOperationData = ProjectStartedOperationData;

export class CustomLedger {
  public constructor(
    private readonly id: string,
    private readonly storage: LedgerStorage,
  ) {}

  public async record<D extends LedgerOperationData>(
    data: D,
  ): Promise<Transaction> {
    const operation = new ProjectStartedOperation(this.id, data);

    const transaction = await operation.createTransaction();
    await this.storage.insertTransaction(transaction);
    return transaction;
  }

  private createOperation(data: LedgerOperationData): ILedgerOperation {
    switch (data.type) {
      case 'PROJECT_STARTED':
        return new ProjectStartedOperation(this.id, data);
      default:
        throw new Error(`Unknown operation type: ${data.type}`);
    }
  }
}
