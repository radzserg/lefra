import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Money } from '@/money/Money.js';
import { DB_ID } from '@/types.js';
import { DatabaseConnection } from 'slonik';

export class PostgresLedgerStorage implements LedgerStorage {
  public constructor(private readonly connection: DatabaseConnection) {}

  public async fetchAccountBalance(
    ledgerId: DB_ID,
    account: LedgerAccount,
  ): Promise<Money | null> {
    return null;
  }

  public async insertTransaction(
    ledgerId: DB_ID,
    transaction: Transaction,
  ): Promise<void> {}
}
