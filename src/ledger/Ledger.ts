import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

export type ILedger = {
  fetchAccountBalance: (
    account: LedgerAccountRef,
  ) => Promise<Unit<UnitCode> | null>;
  record: (operation: ILedgerOperation) => Promise<Transaction>;
};

export class Ledger implements ILedger {
  public constructor(private readonly storage: LedgerStorage) {}

  public async record(operation: ILedgerOperation): Promise<Transaction> {
    const transaction = await operation.createTransaction();
    await this.storage.insertTransaction(transaction);
    return transaction;
  }

  public async fetchAccountBalance(account: LedgerAccountRef) {
    return this.storage.fetchAccountBalance(account);
  }
}
