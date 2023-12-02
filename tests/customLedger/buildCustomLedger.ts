import { LedgerUnexpectedError } from '@/errors.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { NormalBalance } from '@/types.js';

const systemAccountTypes: {
  [k in string]: [NormalBalance];
} = {
  ASSETS: ['DEBIT'],
  CURRENT_ASSETS: ['DEBIT'],
  EQUITY: ['CREDIT'],
  EXPENSES: ['DEBIT'],
  INCOME: ['CREDIT'],
  LIABILITIES: ['CREDIT'],
  PAYABLES: ['CREDIT'],
  RECEIVABLES: ['DEBIT'],
};
export type CustomLedgerSystemAccounts = keyof typeof systemAccountTypes;

const userAccountTypes: {
  [k in string]: [NormalBalance];
} = {
  USER_PAYABLES: ['CREDIT'],
  USER_PAYABLES_LOCKED: ['CREDIT'],
  USER_RECEIVABLES: ['DEBIT'],
};

const systemAccounts: {
  [k in string]: [CustomLedgerSystemAccounts];
} = {
  SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA: ['ASSETS'],
  SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES: ['EXPENSES'],
  SYSTEM_EXPENSES_PAYOUTS: ['EXPENSES'],
  SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES: ['EXPENSES'],
  SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES: ['EXPENSES'],
  SYSTEM_INCOME_CONTRACT_FEES: ['INCOME'],
  SYSTEM_INCOME_CURRENCY_CONVERSION_GAINS: ['INCOME'],
  SYSTEM_INCOME_PAID_PROJECTS: ['INCOME'],
  SYSTEM_INCOME_PAYMENT_FEE: ['INCOME'],
  SYSTEM_INCOME_STRIPE_PAY_IN_FEES: ['INCOME'],
};

export type CustomLedgerEntityAccounts = keyof typeof systemAccountTypes;

export const buildCustomLedger = async (
  ledgerId: string,
  storage: LedgerStorage,
) => {
  for (const [name, [normalBalance]] of Object.entries(systemAccountTypes)) {
    await storage.insertAccountType({
      description: '',
      isEntityLedgerAccount: false,
      ledgerId,
      name,
      normalBalance,
      parentLedgerAccountTypeId: null,
      slug: name,
    });
  }

  for (const [name, [normalBalance]] of Object.entries(userAccountTypes)) {
    await storage.insertAccountType({
      description: '',
      isEntityLedgerAccount: true,
      ledgerId,
      name,
      normalBalance,
      parentLedgerAccountTypeId: null,
      slug: name,
    });
  }

  for (const [name, [accountTypeSlug]] of Object.entries(systemAccounts)) {
    const accountType = await storage.findAccountTypeBySlug(accountTypeSlug);
    if (!accountType) {
      throw new LedgerUnexpectedError(
        `Account type ${accountTypeSlug} is not found in the system`,
      );
    }

    await storage.upsertAccount({
      description: '',
      isSystemAccount: true,
      ledgerAccountTypeId: accountType.id,
      ledgerId,
      slug: name,
    });
  }
};
