import { Transaction } from "../records/Transaction";
import { LedgerStorage } from "./LedgerStorage";

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private transactions: Transaction[] = [];

  // @todo add entries

  public constructor() {}

  public async saveTransaction(transaction: Transaction) {
    // @todo: check accounts
    // @todo check dynamic account creation
    // ledger_account_id_for_user

    transaction.entries.map((entry) => {});

    this.transactions.push(transaction);
  }
}
