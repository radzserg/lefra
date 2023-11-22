import { Transaction } from "../records/Transaction";
import { LedgerStorage } from "./LedgerStorage";
import { LedgerAccount } from "../accounts/LedgerAccount";

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private transactions: Transaction[] = [];
  private accounts: Transaction[] = [];

  // @todo add entries

  public constructor() {}

  public async saveTransaction(transaction: Transaction) {}

  private async saveLedgerAccounts(transaction: Transaction) {
    const ledgerAccounts: Record<string, LedgerAccount> = {};
    for (const operation of transaction.operations) {
      ledgerAccounts[operation.account.uniqueNameIdentifier] =
        operation.account;
    }
  }
}
