import { Transaction } from '../transaction/Transaction.js';
import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { Money } from '@/money/Money.js';
import {
  DB_ID,
  InputLedgerAccount,
  InputLedgerAccountType,
  LedgerInput,
  PersistedEntry,
  PersistedLedger,
  PersistedLedgerAccount,
  PersistedLedgerAccountType,
  PersistedTransaction,
} from '@/types.js';

export type LedgerStorage = {
  /**
   * Fetches the current balance of the account.
   */
  fetchAccountBalance: (account: LedgerAccountRef) => Promise<Money | null>;

  /**
   * Return the ledger account by ledger account reference.
   * @param parameters
   */
  findAccount: (
    account: LedgerAccountRef,
  ) => Promise<PersistedLedgerAccount | null>;

  /**
   * Return the ledger account by slug.
   */
  findAccountTypeBySlug: (
    slug: string,
  ) => Promise<PersistedLedgerAccountType | null>;

  /**
   * Return the ledger id for the given slug.
   */
  getLedgerIdBySlug: (slug: string) => Promise<DB_ID>;

  /**
   * Returns transaction by given ID.
   */
  getTransactionById: (transactionId: DB_ID) => Promise<PersistedTransaction>;

  /**
   * Return transaction entries.
   */
  getTransactionEntries: (transactionId: DB_ID) => Promise<PersistedEntry[]>;

  /**
   * Inserts a new ledger account type.
   * @param parameters
   */
  insertAccountType: (
    parameters: InputLedgerAccountType,
  ) => Promise<PersistedLedgerAccountType>;

  /**
   * Inserts a new ledger.
   * @param parameters
   */
  insertLedger: (parameters: LedgerInput) => Promise<PersistedLedger>;

  /**
   * Inserts a new transaction.
   * @param ledgerId
   * @param transaction
   */
  insertTransaction: (
    transaction: Transaction,
  ) => Promise<PersistedTransaction>;

  /**
   * Insert ledger account.
   */
  upsertAccount: (
    parameters: InputLedgerAccount,
  ) => Promise<PersistedLedgerAccount>;
};
