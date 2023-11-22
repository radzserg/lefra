import { Transaction } from "../records/Transaction";
import { LedgerStorage } from "./LedgerStorage";
import { LedgerAccount } from "../accounts/LedgerAccount";
import { LedgerError } from "../../errors";
import { Entry } from "../records/Entry";

type LedgerAccounts = Record<string, LedgerAccount>;

type SavedTransaction = Omit<Transaction, "entries">;

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private transactions: SavedTransaction[] = [];
  private entries: Entry[] = [];

  private accounts: LedgerAccounts = {};

  // @todo add entries

  public constructor() {}

  public async insertTransaction(transaction: Transaction) {
    await this.saveTransactionLedgerAccounts(transaction);
    await this.saveTransactionEntries(transaction);
    this.transactions.push({
      id: transaction.id,
      description: transaction.description,
    });
  }

  public async saveAccounts(accounts: LedgerAccount[]) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(account);
      if (existingAccount) {
        if (!account.canBeInserted) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
          );
        }
        return existingAccount;
      }
      this.accounts[account.uniqueNamedIdentifier] = account;
    }
  }

  private async saveTransactionEntries(transaction: Transaction) {
    for (const operation of transaction.entries) {
      const existingAccount = await this.findSavedAccount(operation.account);
      if (!existingAccount) {
        throw new LedgerError(
          `Account ${operation.account.uniqueNamedIdentifier} not found`,
        );
      }
      operation.accountId = existingAccount.id;
    }
    this.entries.push(...transaction.entries);
  }

  private async saveTransactionLedgerAccounts(transaction: Transaction) {
    const ledgerAccounts: LedgerAccounts = {};
    for (const operation of transaction.entries) {
      ledgerAccounts[operation.account.uniqueNamedIdentifier] =
        operation.account;
    }
    await this.findOrInsertLedgerAccounts(ledgerAccounts);
  }

  private async findSavedAccount(account: LedgerAccount) {
    return this.accounts[account.uniqueNamedIdentifier];
  }

  private async findOrInsertLedgerAccounts(accounts: LedgerAccounts) {
    for (const account of Object.values(accounts)) {
      const existingAccount = await this.findSavedAccount(account);
      if (!existingAccount) {
        if (!account.canBeInserted) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
          );
        }
        this.accounts[account.uniqueNamedIdentifier] = account;
      }
    }
  }

  public async findAccounts() {
    return Object.values(this.accounts);
  }

  public async findEntries() {
    return this.entries;
  }

  public async findTransactions() {
    return this.transactions;
  }
}
