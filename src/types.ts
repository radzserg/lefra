import { CreditEntry, DebitEntry } from '@/ledger/transaction/Entry.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';

export type ArrayType<T> = T extends Array<infer U> ? U : T;

export type DB_ID = number; // for now support only integer ids but in the future we might want to support string ids as well

export type EntryAction = 'CREDIT' | 'DEBIT';

export type EntryInput = {
  action: EntryAction;
  amount: Unit<UnitCode>;
  ledgerAccountId: DB_ID;
  ledgerTransactionId: DB_ID;
};

export type ExtractUnitCode<T> = ExtractUnitFromEntry<ArrayType<T>>;

export type InputLedgerAccount = {
  description: null | string;
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

export type InputLedgerCurrency = {
  code: string;
  minimumFractionDigits: number;
  symbol: string;
};

export type LedgerInput = {
  description: string;
  ledgerCurrencyId: DB_ID;
  name: string;
  slug: string;
};

export type LedgerSpecification = {
  currencyCode: string;
  entityAccountTypes: readonly string[];
  slug: string;
  systemAccounts: readonly string[];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type NormalBalance = 'CREDIT' | 'DEBIT';
export type Persisted<T extends object> = Readonly<T & { id: DB_ID }>;
export type PersistedEntry = Persisted<EntryInput>;
export type PersistedLedger = Persisted<LedgerInput>;
export type PersistedLedgerAccount = Persisted<InputLedgerAccount>;
export type PersistedLedgerAccountType = Persisted<InputLedgerAccountType>;

export type PersistedLedgerCurrency = Persisted<InputLedgerCurrency>;

export type PersistedTransaction = Persisted<TransactionInput>;
export type TransactionInput = {
  description: null | string;
  ledgerId: DB_ID;
  postedAt: Date | null;
};
type ExtractUnitFromEntry<T> =
  T extends DebitEntry<infer C>
    ? C
    : T extends CreditEntry<infer C>
      ? C
      : never;
