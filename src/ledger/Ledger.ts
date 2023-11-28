import { LedgerStorage } from './storage/LedgerStorage.js';
import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { Transaction } from '@/ledger/records/Transaction.js';
import { INTERNAL_ID } from '@/types.js';

export class Ledger {
  public constructor(
    private readonly id: INTERNAL_ID,
    private readonly storage: LedgerStorage,
  ) {}

  public async record(operation: ILedgerOperation): Promise<Transaction> {
    const transaction = await operation.createTransaction(this.id);
    await this.storage.insertTransaction(transaction);
    return transaction;
  }
}
