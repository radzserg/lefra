import { CurrencyCode } from '@/money/currencies.js';
import { Money } from '@/money/Money.js';

export type EntryAction = 'DEBIT' | 'CREDIT';

export type NonEmptyArray<T> = [T, ...T[]];

export type DB_ID = string | number;

export type ArrayType<T> = T extends Array<infer U> ? U : never;

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type InputLedgerAccount = {
  description: string | null;
  ledgerAccountTypeId: DB_ID;
  ledgerId: DB_ID;
  slug: string;
};

export type InputLedgerAccountType = {
  description: string;
  isEntityLedgerAccount: boolean;
  name: string;
  normalBalance: NormalBalance;
  parentLedgerAccountTypeId: DB_ID | null;
  slug: string;
};

export type LedgerInput = {
  currencyCode: CurrencyCode;
  description: string;
  name: string;
  slug: string;
};

export type TransactionInput = {
  description: string | null;
  ledgerId: DB_ID;
  postedAt: Date | null;
};

export type EntryInput = {
  action: EntryAction;
  amount: Money;
  ledgerAccountId: DB_ID;
  ledgerTransactionId: DB_ID;
};

export type Persisted<T extends object> = Readonly<T & { id: DB_ID }>;

export type PersistedLedgerAccountType = Persisted<InputLedgerAccountType>;
export type PersistedLedger = Persisted<LedgerInput>;
export type PersistedLedgerAccount = Persisted<InputLedgerAccount>;
export type PersistedTransaction = Persisted<TransactionInput>;
export type PersistedEntry = Persisted<EntryInput>;

export type LedgerSpecification = {
  entityAccountTypes: readonly string[];
  slug: string;
  systemAccounts: readonly string[];
};
