import { LedgerAccount } from '../accounts/LedgerAccount.js';
import { SystemLedgerAccount } from '../accounts/SystemLedgerAccount.js';
import { UserLedgerAccount } from '../accounts/UserLedgerAccount.js';
import { Entry } from '../records/Entry.js';
import { Transaction } from '../records/Transaction.js';
import { LedgerStorage } from './LedgerStorage.js';
import { LedgerError } from '@/errors.js';
import { EXTERNAL_ID, INTERNAL_ID } from '@/types.js';

type SavedTransaction = {
  description: string | null;
  id: string;
  ledgerId: string;
};

type SavedSystemAccount = {
  id: string;
  ledgerId: string;
  name: string;
  type: 'SYSTEM';
};

type SavedUserAccount = {
  id: string;
  ledgerId: string;
  name: string;
  type: 'USER';
  userAccountId: EXTERNAL_ID;
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

  public async insertTransaction(transaction: Transaction) {
    await this.saveTransactionLedgerAccounts(transaction);
    await this.saveTransactionEntries(transaction);

    this.transactions.push({
      description: transaction.description,
      id: transaction.id,
      ledgerId: transaction.ledgerId,
    });
  }

  public async saveAccounts(ledgerId: INTERNAL_ID, accounts: LedgerAccount[]) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(ledgerId, account);
      if (existingAccount) {
        if (!account.canBeInserted) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
          );
        }

        continue;
      }

      this.accounts.push(this.accountToSavedAccount(ledgerId, account));
    }
  }

  private accountToSavedAccount(
    ledgerId: INTERNAL_ID,
    account: LedgerAccount,
  ): SavedAccount {
    if (account instanceof SystemLedgerAccount) {
      return {
        id: account.id,
        ledgerId,
        name: account.name,
        type: 'SYSTEM',
      };
    } else if (account instanceof UserLedgerAccount) {
      return {
        id: account.id,
        ledgerId,
        name: account.name,
        type: 'USER',
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

  private async findSavedAccount(
    ledgerId: INTERNAL_ID,
    account: LedgerAccount,
  ) {
    const foundAccount = this.accounts.find((savedAccount) => {
      if (account instanceof SystemLedgerAccount) {
        return (
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId
        );
      } else if (account instanceof UserLedgerAccount) {
        if (savedAccount.type !== 'USER') {
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
    ledgerId: INTERNAL_ID,
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
