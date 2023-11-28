import { EntityLedgerAccount } from '../accounts/EntityLedgerAccount.js';
import { LedgerAccount } from '../accounts/LedgerAccount.js';
import { SystemLedgerAccount } from '../accounts/SystemLedgerAccount.js';
import { Transaction } from '../records/Transaction.js';
import { LedgerStorage } from './LedgerStorage.js';
import { LedgerError } from '@/errors.js';
import { Entry } from '@/ledger/records/Entry.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { Money } from '@/money/Money.js';
import { DB_ID, OperationType } from '@/types.js';

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
  amount: Money;
  id: DB_ID;
  transactionId: DB_ID;
  type: OperationType;
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

  public async insertTransaction(transaction: Transaction) {
    const savedTransaction: SavedTransaction = {
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId: transaction.ledgerId,
    };

    await this.saveTransactionLedgerAccounts(transaction);
    await this.saveTransactionEntries(savedTransaction, transaction.entries);

    this.transactions.push({
      description: transaction.description,
      id: this.idGenerator.generateId(),
      ledgerId: transaction.ledgerId,
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
        if (!(account instanceof EntityLedgerAccount)) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
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
    if (account instanceof SystemLedgerAccount) {
      return {
        id: this.idGenerator.generateId(),
        ledgerId,
        name: account.name,
        normalBalance,
        type: 'SYSTEM',
      };
    } else if (account instanceof EntityLedgerAccount) {
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
        throw new LedgerError(
          `Account ${entry.account.uniqueNamedIdentifier} not found`,
        );
      }

      savedEntries.push({
        accountId: existingAccount.id,
        amount: entry.amount,
        id: this.idGenerator.generateId(),
        transactionId: transaction.id,
        type: entry.type,
      });
    }

    this.entries.push(...savedEntries);
  }

  private async saveTransactionLedgerAccounts(transaction: Transaction) {
    const ledgerAccounts: LedgerAccount[] = [];
    for (const entry of transaction.entries) {
      ledgerAccounts.push(entry.account);
    }

    await this.findOrInsertLedgerAccounts(transaction.ledgerId, ledgerAccounts);
  }

  private async findSavedAccount(ledgerId: DB_ID, account: LedgerAccount) {
    const foundAccount = this.accounts.find((savedAccount) => {
      if (account instanceof SystemLedgerAccount) {
        return (
          savedAccount.name === account.name &&
          savedAccount.ledgerId === ledgerId
        );
      } else if (account instanceof EntityLedgerAccount) {
        if (savedAccount.type !== 'ENTITY') {
          return false;
        }

        return (
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
        if (!(account instanceof EntityLedgerAccount)) {
          throw new LedgerError(
            `Account ${account.uniqueNamedIdentifier} cannot be inserted`,
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

  public async fetchAccountBalance(account: LedgerAccount): Promise<Money> {
    /**
     * -- Determine normal balance type for account ('DEBIT' | 'CREDIT')
     * SELECT normal_balance
     * FROM ledger_account la
     * INNER JOIN ledger_account_type lat ON
     * la.ledger_account_type_id = lat.id
     * WHERE la.id = input_ledger_account_id
     * INTO account_balance_type;
     *
     * IF account_balance_type IS NULL THEN
     * RAISE EXCEPTION 'Account does not exist. ID: %', input_ledger_account_id;
     * END IF;
     *
     * -- Sum up all debit entries for this account
     * SELECT COALESCE(sum(amount), 0)
     * FROM ledger_transaction_entry lte
     * LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
     * WHERE
     * ledger_account_id = input_ledger_account_id AND
     * action = 'DEBIT' AND
     * lt.posted_at < before_date
     * INTO sum_debits;
     *
     * -- Sum up all credit entries for this account
     * SELECT COALESCE(sum(amount), 0)
     * FROM ledger_transaction_entry lte
     * LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
     * WHERE
     * ledger_account_id = input_ledger_account_id AND
     * action = 'CREDIT' AND
     * lt.posted_at < before_date
     * INTO sum_credits;
     *
     * IF account_balance_type = 'DEBIT' THEN
     * balance = 0 + sum_debits - sum_credits;
     * ELSEIF account_balance_type = 'CREDIT' THEN
     * balance = 0 + sum_credits - sum_debits;
     * ELSE
     * RAISE EXCEPTION 'Unexpected account_balance_type: %', account_balance_type;
     * END IF;
     *
     * RETURN balance;
     */
    return new Money(0, 'USD');
  }
}
