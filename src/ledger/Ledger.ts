import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';

export class Ledger {
  public constructor(private readonly storage: LedgerStorage) {}

  public async record(operation: ILedgerOperation): Promise<Transaction> {
    const transaction = await operation.createTransaction();
    await this.storage.insertTransaction(transaction);
    return transaction;
  }
}
