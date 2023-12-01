import { LedgerAccountRef } from '../../accounts/LedgerAccountRef.js';
import { Transaction } from '../../transaction/Transaction.js';
import { LedgerStorage } from '../LedgerStorage.js';
import {
  LedgerError,
  LedgerNotFoundError,
  LedgerUnexpectedError,
} from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import {
  DB_ID,
  InputLedgerAccount,
  LedgerInput,
  PersistedEntry,
  PersistedLedger,
  PersistedLedgerAccount,
  PersistedLedgerAccountType,
  PersistedTransaction,
} from '@/types.js';

// const createPersistedEntity = <T extends object>(entry: T): Persisted<T> => {
//   const idGenerator = new UuidDatabaseIdGenerator();
//   const id = idGenerator.generateId();
//   return new Proxy(entry, {
//     get(target, property) {
//       if (property === 'id') {
//         return id;
//       }
//
//       return target[property as keyof T];
//     },
//   }) as Persisted<T>;
// };

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  public ledgers: PersistedLedger[] = [];

  public accountTypes: PersistedLedgerAccountType[] = [];

  public accounts: PersistedLedgerAccount[] = [];

  public transactions: PersistedTransaction[] = [];

  public entries: PersistedEntry[] = [];

  private readonly idGenerator: UuidDatabaseIdGenerator =
    new UuidDatabaseIdGenerator();

  /**
   * Inserts a new ledger.
   */
  public async insertLedger({
    currencyCode,
    description,
    name,
    slug,
  }: LedgerInput) {
    const existedLedger = await this.getLedgerIdBySlug(slug);
    if (existedLedger) {
      throw new LedgerError(`Ledger ${slug} already exists`);
    }

    const persistedLedger = {
      currencyCode,
      description,
      id: this.idGenerator.generateId(),
      name,
      slug,
    };
    this.ledgers.push(persistedLedger);
    return persistedLedger;
  }

  public async insertAccountType({
    description,
    isEntityLedgerAccount,
    ledgerId,
    name,
    normalBalance,
    parentLedgerAccountTypeId = null,
    slug,
  }: {
    description: string;
    isEntityLedgerAccount: boolean;
    ledgerId: DB_ID;
    name: string;
    normalBalance: 'CREDIT' | 'DEBIT';
    parentLedgerAccountTypeId?: DB_ID | null;
    slug: string;
  }) {
    const existingAccount = await this.findAccountTypeBySlug(slug);
    if (existingAccount && !existingAccount.isEntityLedgerAccount) {
      throw new LedgerError(`Account type ${slug} already exists.`);
    }

    if (parentLedgerAccountTypeId) {
      const parentAccount = await this.getSavedAccountTypeById(
        parentLedgerAccountTypeId,
      );
      if (!parentAccount) {
        throw new LedgerError('Parent account type not found');
      }

      if (parentAccount.normalBalance !== normalBalance) {
        throw new LedgerError(
          'Parent account type must have the same normal balance',
        );
      }
    }

    const persistedLedgerAccountType = {
      description,
      id: this.idGenerator.generateId(),
      isEntityLedgerAccount,
      ledgerId,
      name,
      normalBalance,
      parentLedgerAccountTypeId,
      slug,
    };
    this.accountTypes.push(persistedLedgerAccountType);
    return persistedLedgerAccountType;
  }

  public async upsertAccount({
    description,
    isSystemAccount,
    ledgerAccountTypeId,
    ledgerId,
    slug,
  }: InputLedgerAccount) {
    const existingAccount = await this.findSavedAccount(ledgerId, slug);
    if (existingAccount) {
      return existingAccount;
    }

    const accountType = await this.getSavedAccountTypeById(ledgerAccountTypeId);

    if (!isSystemAccount && !accountType.isEntityLedgerAccount) {
      throw new LedgerError(
        `The account type with ID ${ledgerAccountTypeId} is not a valid entity ledger account type, so it cannot be used to insert an entity ledger account.`,
      );
    }

    const persistedAccount = {
      description,
      id: this.idGenerator.generateId(),
      isSystemAccount,
      ledgerAccountTypeId,
      ledgerId,
      slug,
    };

    this.accounts.push(persistedAccount);
    return persistedAccount;
  }

  public async getLedgerIdBySlug(slug: string) {
    const existingLedger = this.ledgers.find((ledger) => ledger.slug === slug);
    if (!existingLedger) {
      throw new LedgerNotFoundError(`Ledger ${slug} not found`);
    }

    return existingLedger.id;
  }

  public async insertTransaction(transaction: Transaction) {
    const savedTransaction: PersistedTransaction = {
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId: transaction.ledgerId,
      postedAt: transaction.postedAt,
    };

    await this.saveTransactionLedgerAccounts(transaction.entries);
    await this.saveTransactionEntries(savedTransaction, transaction.entries);

    this.transactions.push(savedTransaction);
    return savedTransaction;
  }

  private async saveTransactionEntries(
    transaction: PersistedTransaction,
    entries: Entry[],
  ) {
    const savedEntries: PersistedEntry[] = [];
    for (const entry of entries) {
      const existingAccount = await this.findAccount(entry.account);
      if (!existingAccount) {
        throw new LedgerNotFoundError(
          `Account ${entry.account.slug} not found`,
        );
      }

      savedEntries.push({
        action: entry.action,
        amount: entry.amount,
        id: this.idGenerator.generateId(),
        ledgerAccountId: existingAccount.id,
        ledgerTransactionId: transaction.id,
      });
    }

    this.entries.push(...savedEntries);
  }

  private async saveTransactionLedgerAccounts(entries: Entry[]) {
    const ledgerAccounts: LedgerAccountRef[] = [];
    for (const entry of entries) {
      ledgerAccounts.push(entry.account);
    }

    await this.findOrInsertLedgerAccounts(ledgerAccounts);
  }

  private async getSavedAccountTypeById(id: DB_ID) {
    const foundAccountType = this.accountTypes.find((savedAccountType) => {
      return savedAccountType.id === id;
    });

    if (!foundAccountType) {
      throw new LedgerError(`Account type ID: ${id} not found`);
    }

    return foundAccountType;
  }

  private async findOrInsertLedgerAccounts(accounts: LedgerAccountRef[]) {
    for (const account of accounts) {
      const existingAccount = await this.findSavedAccount(
        account.ledgerId,
        account.slug,
      );
      if (existingAccount) {
        continue;
      }

      if (!(account instanceof EntityAccountRef)) {
        throw new LedgerError(
          `Account ${account.slug} does not exist. Only entity accounts can be inserted`,
        );
      }

      const accountType = await this.findAccountTypeBySlug(account.name);
      if (!accountType) {
        throw new LedgerError(`Account type ${account.slug} not found`);
      }

      if (!accountType.isEntityLedgerAccount) {
        throw new LedgerError('Only entity accounts can be inserted');
      }

      await this.upsertAccount({
        description: accountType.description
          ? `${accountType.description}. Account created for entity ID:${account.externalId}.`
          : null,
        isSystemAccount: false,
        ledgerAccountTypeId: accountType.id,
        ledgerId: account.ledgerId,
        slug: account.slug,
      });
    }
  }

  public async fetchAccountBalance(
    account: LedgerAccountRef,
  ): Promise<Money | null> {
    const savedAccount = await this.findAccount(account);
    if (!savedAccount) {
      throw new LedgerNotFoundError(`Account ${account.slug} not found`);
    }

    const ledgerAccountTypeId = savedAccount.ledgerAccountTypeId;
    const ledgerAccountType =
      await this.getSavedAccountTypeById(ledgerAccountTypeId);

    const normalBalance = ledgerAccountType.normalBalance;
    let sumDebits: Money | null = null;
    let sumCredits: Money | null = null;
    for (const entry of this.entries) {
      if (
        account.ledgerId !== savedAccount.ledgerId ||
        entry.ledgerAccountId !== savedAccount.id
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

  public async findAccount(
    account: LedgerAccountRef,
  ): Promise<PersistedLedgerAccount | null> {
    const foundAccount = this.accounts.find((savedAccount) => {
      return (
        savedAccount.slug === account.slug &&
        savedAccount.ledgerId === account.ledgerId
      );
    });

    return foundAccount ?? null;
  }

  private async findSavedAccount(ledgerId: DB_ID, slug: string) {
    const foundAccount = this.accounts.find((savedAccount) => {
      return savedAccount.slug === slug && savedAccount.ledgerId === ledgerId;
    });

    return foundAccount ?? null;
  }

  public async findAccountTypeBySlug(
    slug: string,
  ): Promise<PersistedLedgerAccountType | null> {
    const foundAccountType = this.accountTypes.find((savedAccountType) => {
      return savedAccountType.slug === slug;
    });

    return foundAccountType ?? null;
  }

  public async getTransactionEntries(
    transactionId: DB_ID,
  ): Promise<PersistedEntry[]> {
    return this.entries.filter(
      (entry) => entry.ledgerTransactionId === transactionId,
    );
  }

  public async getTransactionById(
    transactionId: DB_ID,
  ): Promise<PersistedTransaction> {
    const transaction = this.transactions.find(
      (savedTransaction) => savedTransaction.id === transactionId,
    );
    if (!transaction) {
      throw new LedgerNotFoundError(`Transaction ${transactionId} not found`);
    }

    return transaction;
  }
}
