import { CreditEntry, DebitEntry } from '@/ledger/transaction/Entry.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

export type EntryAction = 'DEBIT' | 'CREDIT';

export type NonEmptyArray<T> = [T, ...T[]];

export type DB_ID = string | number;

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type InputLedgerAccount = {
  description: string | null;
  ledgerAccountTypeId: DB_ID;
  ledgerId: DB_ID;
  slug: string;
};

export type InputLedgerCurrency = {
  code: string;
  minimumFractionDigits: number;
  symbol: string;
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
  description: string;
  ledgerCurrencyId: DB_ID;
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
  amount: Unit<UnitCode>;
  ledgerAccountId: DB_ID;
  ledgerTransactionId: DB_ID;
};

export type Persisted<T extends object> = Readonly<T & { id: DB_ID }>;

export type PersistedLedgerAccountType = Persisted<InputLedgerAccountType>;
export type PersistedLedger = Persisted<LedgerInput>;
export type PersistedLedgerAccount = Persisted<InputLedgerAccount>;
export type PersistedTransaction = Persisted<TransactionInput>;
export type PersistedEntry = Persisted<EntryInput>;
export type PersistedLedgerCurrency = Persisted<InputLedgerCurrency>;

export type LedgerSpecification = {
  currencyCode: string;
  entityAccountTypes: readonly string[];
  slug: string;
  systemAccounts: readonly string[];
};

export type ArrayType<T> = T extends Array<infer U> ? U : T;
type ExtractUnitFromEntry<T> = T extends DebitEntry<infer C>
  ? C
  : T extends CreditEntry<infer C>
    ? C
    : never;
export type ExtractUnitCode<T> = ExtractUnitFromEntry<ArrayType<T>>;
