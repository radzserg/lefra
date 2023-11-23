import { Transaction } from "../records/Transaction";
import { LedgerStorage } from "./LedgerStorage";
import { LedgerAccount } from "../accounts/LedgerAccount";
import { LedgerError } from "../../errors";
import { Entry } from "../records/Entry";
import { SystemLedgerAccount } from "../accounts/SystemLedgerAccount";
import { UserLedgerAccount } from "../accounts/UserLedgerAccount";

type SavedTransaction = {
  id: string;
  ledgerId: string;
  description: string | null;
};

type SavedSystemAccount = {
  type: "SYSTEM";
  id: string;
  ledgerId: string;
  name: string;
};

type SavedUserAccount = {
  type: "USER";
  id: string;
  ledgerId: string;
  name: string;
  userAccountId: number;
};

type SavedAccount = SavedSystemAccount | SavedUserAccount;

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private transactions: SavedTransaction[] = [];
  private entries: Entry[] = [];
  private accounts: SavedAccount[] = [];

  // @todo add entries

  public constructor() {}

  public async insertTransaction(transaction: Transaction) {
    await this.saveTransactionLedgerAccounts(transaction);
    await this.saveTransactionEntries(transaction);

    this.transactions.push({
      id: transaction.id,
      ledgerId: transaction.ledgerId,
      description: transaction.description,
    });
  }

  public async saveAccounts(ledgerId: string, accounts: LedgerAccount[]) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(ledgerId, account);
      if (existingAccount) {
        if (!account.canBeInserted) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
          );
        }
        return existingAccount;
      }
      this.accounts.push(this.accountToSavedAccount(ledgerId, account));
    }
  }

  private accountToSavedAccount(
    ledgerId: string,
    account: LedgerAccount,
  ): SavedAccount {
    if (account instanceof SystemLedgerAccount) {
      return {
        type: "SYSTEM",
        id: account.id,
        ledgerId,
        name: account.name,
      };
    } else if (account instanceof UserLedgerAccount) {
      return {
        type: "USER",
        id: account.id,
        ledgerId,
        name: account.name,
        userAccountId: account.userAccountId,
      };
    } else {
      throw new LedgerError(`Unknown account type ${account}`);
    }
  }

  private async saveTransactionEntries(transaction: Transaction) {
    for (const operation of transaction.entries) {
      const existingAccount = await this.findSavedAccount(
        transaction.ledgerId,
        operation.account,
      );
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
    const ledgerAccounts: LedgerAccount[] = [];
    for (const entry of transaction.entries) {
      ledgerAccounts.push(entry.account);
    }
    await this.findOrInsertLedgerAccounts(transaction.ledgerId, ledgerAccounts);
  }

  private async findSavedAccount(ledgerId: string, account: LedgerAccount) {
    const foundAccount = this.accounts.find((savedAccount) => {
      if (account instanceof SystemLedgerAccount) {
        return (
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId
        );
      } else if (account instanceof UserLedgerAccount) {
        if (savedAccount.type !== "USER") {
          return false;
        }
        return (
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId &&
          savedAccount.userAccountId === account.userAccountId
        );
      }
      return false;
    });

    return foundAccount ?? null;
  }

  private async findOrInsertLedgerAccounts(
    ledgerId: string,
    accounts: LedgerAccount[],
  ) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(ledgerId, account);
      if (!existingAccount) {
        if (!account.canBeInserted) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
          );
        }
        this.accounts.push(this.accountToSavedAccount(ledgerId, account));
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
