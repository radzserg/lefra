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
import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import {
  DB_ID,
  InputLedgerAccount,
  InputLedgerCurrency,
  LedgerInput,
  PersistedEntry,
  PersistedLedger,
  PersistedLedgerAccount,
  PersistedLedgerAccountType,
  PersistedLedgerCurrency,
  PersistedTransaction,
} from '@/types.js';

/**
 * In memory implementation of the ledger storage.
 * This implementation is not persistent and is used for testing.
 */
export class InMemoryLedgerStorage implements LedgerStorage {
  public ledgers: PersistedLedger[] = [];

  public currencies: PersistedLedgerCurrency[] = [];

  public accountTypes: PersistedLedgerAccountType[] = [];

  public accounts: PersistedLedgerAccount[] = [];

  public transactions: PersistedTransaction[] = [];

  public entries: PersistedEntry[] = [];

  public ledgerLedgerAccountTypes: Array<{
    ledgerAccountTypeId: DB_ID;
    ledgerId: DB_ID;
  }> = [];

  private readonly idGenerator: UuidDatabaseIdGenerator =
    new UuidDatabaseIdGenerator();

  /**
   * Inserts a new ledger.
   */
  public async insertLedger({
    description,
    ledgerCurrencyId,
    name,
    slug,
  }: LedgerInput) {
    const existedLedger = await this.findLedgerIdBySlug(slug);
    if (existedLedger) {
      throw new LedgerError(`Ledger ${slug} already exists`);
    }

    const persistedLedger = {
      description,
      id: this.idGenerator.generateId(),
      ledgerCurrencyId,
      name,
      slug,
    };
    this.ledgers.push(persistedLedger);
    return persistedLedger;
  }

  public async insertAccountType({
    description,
    isEntityLedgerAccount,
    name,
    normalBalance,
    parentLedgerAccountTypeId = null,
    slug,
  }: {
    description: string;
    isEntityLedgerAccount: boolean;
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
      name,
      normalBalance,
      parentLedgerAccountTypeId,
      slug,
    };
    this.accountTypes.push(persistedLedgerAccountType);
    return persistedLedgerAccountType;
  }

  public async assignAccountTypeToLedger({
    accountTypeId,
    ledgerId,
  }: {
    accountTypeId: DB_ID;
    ledgerId: DB_ID;
  }) {
    this.ledgerLedgerAccountTypes.push({
      ledgerAccountTypeId: accountTypeId,
      ledgerId,
    });
  }

  public async upsertAccount({
    description,
    ledgerAccountTypeId,
    ledgerId,
    slug,
  }: InputLedgerAccount) {
    const existingAccount = await this.findSavedAccount(ledgerId, slug);
    if (existingAccount) {
      return existingAccount;
    }

    const accountType = await this.getSavedAccountTypeById(ledgerAccountTypeId);

    const persistedAccount = {
      description,
      id: this.idGenerator.generateId(),
      ledgerAccountTypeId: accountType.id,
      ledgerId,
      slug,
    };

    this.accounts.push(persistedAccount);
    return persistedAccount;
  }

  public async getLedgerIdBySlug(slug: string) {
    const existingLedger = await this.findLedgerIdBySlug(slug);
    if (!existingLedger) {
      throw new LedgerNotFoundError(`Ledger ${slug} not found`);
    }

    return existingLedger;
  }

  public async findLedgerIdBySlug(slug: string) {
    return this.ledgers.find((ledger) => ledger.slug === slug);
  }

  public async insertCurrency(parameters: InputLedgerCurrency) {
    const persistedCurrency = {
      code: parameters.code,
      id: this.idGenerator.generateId(),
      minimumFractionDigits: parameters.minimumFractionDigits,
      symbol: parameters.symbol,
    };
    this.currencies.push(persistedCurrency);
    return persistedCurrency;
  }

  public async insertTransaction(transaction: Transaction) {
    const { id: ledgerId } = await this.getLedgerIdBySlug(
      transaction.ledgerSlug,
    );
    const savedTransaction: PersistedTransaction = {
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId,
      postedAt: transaction.postedAt,
    };

    await this.saveTransactionLedgerAccounts(transaction.entries);
    await this.saveTransactionEntries(savedTransaction, transaction.entries);

    this.transactions.push(savedTransaction);
    return savedTransaction;
  }

  private async saveTransactionEntries(
    transaction: PersistedTransaction,
    entries: Array<Entry<UnitCode>>,
  ) {
    const savedEntries: PersistedEntry[] = [];
    for (const entry of entries) {
      const existingAccount = await this.findAccount(entry.account);
      if (!existingAccount) {
        throw new LedgerNotFoundError(
          `Account ${entry.account.accountSlug} not found`,
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

  private async saveTransactionLedgerAccounts(entries: Array<Entry<UnitCode>>) {
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
      const existingAccount = await this.findSavedAccountByAccountRef(account);
      if (existingAccount) {
        continue;
      }

      if (!(account instanceof EntityAccountRef)) {
        throw new LedgerError(
          `Account ${account.accountSlug} does not exist. Only entity accounts can be inserted`,
        );
      }

      const accountType = await this.findAccountTypeBySlug(account.name);
      if (!accountType) {
        throw new LedgerError(`Account type ${account.accountSlug} not found`);
      }

      const { id: ledgerId } = await this.getLedgerIdBySlug(account.ledgerSlug);
      const accountTypesBelongsToLedger = this.ledgerLedgerAccountTypes.find(
        (ledgerLedgerAccountType) =>
          ledgerLedgerAccountType.ledgerId === ledgerId,
      );
      if (!accountTypesBelongsToLedger) {
        throw new LedgerError(
          `Account type ${account.accountSlug} not found for ledger ${account.ledgerSlug}`,
        );
      }

      if (!accountType.isEntityLedgerAccount) {
        throw new LedgerError(
          `Account ${account.accountSlug} cannot be inserted. Only entity accounts can be inserted`,
        );
      }

      await this.upsertAccount({
        description: accountType.description
          ? `${accountType.description}. Account created for entity ID:${account.externalId}.`
          : null,
        ledgerAccountTypeId: accountType.id,
        ledgerId,
        slug: account.accountSlug,
      });
    }
  }

  public async fetchAccountBalance(
    account: LedgerAccountRef,
  ): Promise<Unit<UnitCode> | null> {
    const savedAccount = await this.findAccount(account);
    if (!savedAccount) {
      throw new LedgerNotFoundError(`Account ${account.accountSlug} not found`);
    }

    const ledgerAccountTypeId = savedAccount.ledgerAccountTypeId;
    const ledgerAccountType =
      await this.getSavedAccountTypeById(ledgerAccountTypeId);

    const normalBalance = ledgerAccountType.normalBalance;
    let sumDebits: Unit<UnitCode> | null = null;
    let sumCredits: Unit<UnitCode> | null = null;
    for (const entry of this.entries) {
      if (entry.ledgerAccountId !== savedAccount.id) {
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
      const ledger = this.ledgers.find(
        (savedLedger) => savedLedger.id === savedAccount.ledgerId,
      );
      if (!ledger) {
        throw new LedgerError(
          `Ledger ${savedAccount.ledgerId} not found for account ${savedAccount.id}`,
        );
      }

      const currency = await this.getLedgerCurrency(ledger.id);

      return new Unit(0, currency.currencyCode, currency.minimumFractionDigits);
    }

    if (normalBalance === 'DEBIT') {
      if (!sumDebits) {
        throw new LedgerError(
          `Debit account ${account.accountSlug} has negative balance`,
        );
      }

      if (sumCredits) {
        return sumDebits.minus(sumCredits);
      } else {
        return sumDebits;
      }
    } else if (normalBalance === 'CREDIT') {
      if (!sumCredits) {
        throw new LedgerError(
          `Credit account ${account.accountSlug} has negative balance`,
        );
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
    const { id: ledgerId } = await this.getLedgerIdBySlug(account.ledgerSlug);
    const foundAccount = this.accounts.find((savedAccount) => {
      return (
        savedAccount.slug === account.accountSlug &&
        savedAccount.ledgerId === ledgerId
      );
    });

    return foundAccount ?? null;
  }

  private async findSavedAccountByAccountRef({
    accountSlug,
    ledgerSlug,
  }: LedgerAccountRef) {
    const ledger = this.ledgers.find(
      (savedLedger) => savedLedger.slug === ledgerSlug,
    );
    if (!ledger) {
      throw new LedgerNotFoundError(`Ledger ${ledgerSlug} not found`);
    }

    const foundAccount = this.accounts.find((savedAccount) => {
      return (
        savedAccount.slug === accountSlug && savedAccount.ledgerId === ledger.id
      );
    });

    return foundAccount ?? null;
  }

  private async findSavedAccount(ledgerId: DB_ID, accountSlug: string) {
    const foundAccount = this.accounts.find((savedAccount) => {
      return (
        savedAccount.slug === accountSlug && savedAccount.ledgerId === ledgerId
      );
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

  /**
   * Return entity account types.
   */
  public async findEntityAccountTypes(
    ledgerId: DB_ID,
  ): Promise<PersistedLedgerAccountType[]> {
    const ledgerAccountTypeIds = this.ledgerLedgerAccountTypes
      .filter(
        (ledgerLedgerAccountType) =>
          ledgerLedgerAccountType.ledgerId === ledgerId,
      )
      .map(
        (ledgerLedgerAccountType) =>
          ledgerLedgerAccountType.ledgerAccountTypeId,
      );
    return this.accountTypes.filter(
      (accountType) =>
        accountType.isEntityLedgerAccount &&
        ledgerAccountTypeIds.includes(accountType.id),
    );
  }

  /**
   * Return entity account types.
   */
  public async findSystemAccounts(
    ledgerId: DB_ID,
  ): Promise<PersistedLedgerAccount[]> {
    return this.accounts.filter((account) => account.ledgerId === ledgerId);
  }

  /**
   * Returns ledger currency
   */
  public async getLedgerCurrency(
    ledgerId: DB_ID,
  ): Promise<{ currencyCode: UnitCode; minimumFractionDigits: number }> {
    const ledger = this.ledgers.find((savedLedger) => {
      return savedLedger.id === ledgerId;
    });
    if (!ledger) {
      throw new LedgerNotFoundError(`Ledger ${ledgerId} not found`);
    }

    const ledgerCurrencyId = ledger.ledgerCurrencyId;

    const foundCurrency = this.currencies.find(
      (currency) => currency.id === ledgerCurrencyId,
    );
    if (!foundCurrency) {
      throw new LedgerError(
        `Ledger ${ledgerCurrencyId} does not have a currency`,
      );
    }

    return {
      currencyCode: foundCurrency.code,
      minimumFractionDigits: foundCurrency.minimumFractionDigits,
    };
  }
}
