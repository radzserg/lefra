import { LedgerAccount } from '../../accounts/LedgerAccount.js';
import { Transaction } from '../../transaction/Transaction.js';
import { LedgerStorage } from '../LedgerStorage.js';
import {
  LedgerError,
  LedgerNotFoundError,
  LedgerUnexpectedError,
} from '@/errors.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import { DB_ID, EntryAction } from '@/types.js';

type NormalBalance = 'DEBIT' | 'CREDIT';

type SavedTransaction = {
  description: string | null;
  id: DB_ID;
  ledgerId: DB_ID;
};

type SavedAccountCore = {
  id: DB_ID;
  ledgerId: DB_ID;
  name: string;
  normalBalance: NormalBalance;
};

type SavedSystemAccount = SavedAccountCore & {
  type: 'SYSTEM';
};

type SavedEntityAccount = SavedAccountCore & {
  entityId: DB_ID;
  type: 'ENTITY';
};

type SavedUserAccountType = {
  ledgerId: DB_ID;
  name: string;
  normalBalance: NormalBalance;
};

type SavedEntry = {
  accountId: DB_ID;
  action: EntryAction;
  amount: Money;
  id: DB_ID;
  transactionId: DB_ID;
};

type SavedAccount = SavedSystemAccount | SavedEntityAccount;

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  private transactions: SavedTransaction[] = [];

  private entries: SavedEntry[] = [];

  private accounts: SavedAccount[] = [];

  private userAccountTypes: SavedUserAccountType[] = [];

  private readonly idGenerator: UuidDatabaseIdGenerator =
    new UuidDatabaseIdGenerator();

  public async reset() {
    this.transactions = [];
    this.entries = [];
    this.accounts = [];
    this.userAccountTypes = [];
  }

  public async insertTransaction(ledgerId: DB_ID, transaction: Transaction) {
    const savedTransaction: SavedTransaction = {
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId,
    };

    await this.saveTransactionLedgerAccounts(ledgerId, transaction);
    await this.saveTransactionEntries(savedTransaction, transaction.entries);

    this.transactions.push({
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId,
    });
  }

  public async saveEntityAccountTypes(
    ledgerId: DB_ID,
    accounts: Array<[string, NormalBalance]>,
  ) {
    for (const [name, normalBalance] of accounts) {
      const existingAccountType = this.userAccountTypes.find(
        (accountType) =>
          accountType.name === name && accountType.ledgerId === ledgerId,
      );
      if (existingAccountType) {
        continue;
      }

      this.userAccountTypes.push({
        ledgerId,
        name,
        normalBalance,
      });
    }
  }

  public async saveAccounts(
    ledgerId: DB_ID,
    accounts: Array<[LedgerAccount, NormalBalance]>,
  ) {
    for (const [account, normalBalance] of accounts) {
      const existingAccount = await this.findSavedAccount(ledgerId, account);
      if (existingAccount) {
        if (account.type === 'SYSTEM') {
          throw new LedgerError(
            `Account ${account.name} is system and already exists.`,
          );
        }

        continue;
      }

      this.accounts.push(
        this.accountToSavedAccount(ledgerId, account, normalBalance),
      );
    }
  }

  private accountToSavedAccount(
    ledgerId: DB_ID,
    account: LedgerAccount,
    normalBalance: NormalBalance,
  ): SavedAccount {
    if (account.type === 'SYSTEM') {
      return {
        id: this.idGenerator.generateId(),
        ledgerId,
        name: account.name,
        normalBalance,
        type: 'SYSTEM',
      };
    } else if (account.type === 'ENTITY') {
      return {
        entityId: account.entityId,
        id: this.idGenerator.generateId(),
        ledgerId,
        name: account.name,
        normalBalance,
        type: 'ENTITY',
      };
    } else {
      throw new LedgerError(`Unknown account type ${account}`);
    }
  }

  private async saveTransactionEntries(
    transaction: SavedTransaction,
    entries: Entry[],
  ) {
    const savedEntries: SavedEntry[] = [];
    for (const entry of entries) {
      const existingAccount = await this.findSavedAccount(
        transaction.ledgerId,
        entry.account,
      );
      if (!existingAccount) {
        if (entry.account.type === 'SYSTEM') {
          throw new LedgerNotFoundError(`Account ${entry.account} not found`);
        } else {
          throw new LedgerNotFoundError(
            `Account ${entry.account}:${entry.account.entityId} not found`,
          );
        }
      }

      savedEntries.push({
        accountId: existingAccount.id,
        action: entry.action,
        amount: entry.amount,
        id: this.idGenerator.generateId(),
        transactionId: transaction.id,
      });
    }

    this.entries.push(...savedEntries);
  }

  private async saveTransactionLedgerAccounts(
    ledgerId: DB_ID,
    transaction: Transaction,
  ) {
    const ledgerAccounts: LedgerAccount[] = [];
    for (const entry of transaction.entries) {
      ledgerAccounts.push(entry.account);
    }

    await this.findOrInsertLedgerAccounts(ledgerId, ledgerAccounts);
  }

  private async findSavedAccount(ledgerId: DB_ID, account: LedgerAccount) {
    const foundAccount = this.accounts.find((savedAccount) => {
      if (account.type === 'SYSTEM') {
        return (
          savedAccount.type === account.type &&
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId
        );
      } else if (account.type === 'ENTITY') {
        return (
          savedAccount.type === account.type &&
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId &&
          savedAccount.entityId === account.entityId
        );
      }

      return false;
    });

    return foundAccount ?? null;
  }

  private async findOrInsertLedgerAccounts(
    ledgerId: DB_ID,
    accounts: LedgerAccount[],
  ) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(ledgerId, account);
      if (!existingAccount) {
        if (account.type === 'SYSTEM') {
          throw new LedgerError(
            `Account ${account.name} is system and cannot be inserted`,
          );
        }

        const savedUserAccount = this.userAccountTypes.find((savedAccount) => {
          return savedAccount.name === account.name;
        });
        if (!savedUserAccount) {
          throw new LedgerError(
            `Entity account type ${account.name} is not allowed`,
          );
        }

        this.accounts.push(
          this.accountToSavedAccount(
            ledgerId,
            account,
            savedUserAccount.normalBalance,
          ),
        );
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

  public async findUserAccountTypes() {
    return this.userAccountTypes;
  }

  public async fetchAccountBalance(
    ledgerId: DB_ID,
    account: LedgerAccount,
  ): Promise<Money | null> {
    const savedAccount = await this.findSavedAccount(ledgerId, account);
    if (!savedAccount) {
      throw new LedgerNotFoundError(`Account ${account.name} not found`);
    }

    const normalBalance = savedAccount.normalBalance;
    let sumDebits: Money | null = null;
    let sumCredits: Money | null = null;
    for (const entry of this.entries) {
      if (
        ledgerId !== savedAccount.ledgerId ||
        entry.accountId !== savedAccount.id
      ) {
        continue;
      }

      if (entry.action === 'DEBIT') {
        if (sumDebits) {
          sumDebits = sumDebits.plus(entry.amount);
        } else {
          sumDebits = entry.amount;
        }
      } else if (entry.action === 'CREDIT') {
        if (sumCredits) {
          sumCredits = sumCredits.plus(entry.amount);
        } else {
          sumCredits = entry.amount;
        }
      } else {
        throw new LedgerUnexpectedError(`Unknown entry type ${entry.action}`);
      }
    }

    if (!sumDebits && !sumCredits) {
      return null;
    }

    if (normalBalance === 'DEBIT') {
      if (!sumDebits) {
        throw new LedgerError('Debit account has negative balance');
      }

      if (sumCredits) {
        return sumDebits.minus(sumCredits);
      } else {
        return sumDebits;
      }
    } else if (normalBalance === 'CREDIT') {
      if (!sumCredits) {
        throw new LedgerError('Credit account has negative balance');
      }

      if (sumDebits) {
        return sumCredits.minus(sumDebits);
      } else {
        return sumCredits;
      }
    } else {
      throw new LedgerUnexpectedError(
        `Unknown normal balance ${normalBalance}`,
      );
    }
  }
}
