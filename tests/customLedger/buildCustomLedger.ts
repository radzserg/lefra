import { LedgerUnexpectedError } from '@/errors.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { NormalBalance } from '@/types.js';

const systemAccountTypes = {
  ASSETS: ['DEBIT'],
  CURRENT_ASSETS: ['DEBIT'],
  EQUITY: ['CREDIT'],
  EXPENSES: ['DEBIT'],
  INCOME: ['CREDIT'],
  LIABILITIES: ['CREDIT'],
  PAYABLES: ['CREDIT'],
  RECEIVABLES: ['DEBIT'],
};
export type CustomLedgerSystemAccountTypes = keyof typeof systemAccountTypes;

const userAccountTypes = {
  USER_PAYABLES: ['CREDIT'],
  USER_PAYABLES_LOCKED: ['CREDIT'],
  USER_RECEIVABLES: ['DEBIT'],
};

export type CustomLedgerEntityAccountTypes = keyof typeof userAccountTypes;

const systemAccounts = {
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

export type CustomLedgerSystemAccounts = keyof typeof systemAccounts;

/**
 * Test function to seed storage with custom ledger accounts.
 */
export const buildCustomLedger = async (storage: LedgerStorage) => {
  const { id: ledgerId } = await storage.insertLedger({
    currencyCode: 'USD',
    description: null,
    name: 'Test ledger',
    slug: 'PLATFORM_USD',
  });

  for (const [name, [normalBalance]] of Object.entries(systemAccountTypes)) {
    await storage.insertAccountType({
      description: '',
      isEntityLedgerAccount: false,
      ledgerId,
      name,
      normalBalance: normalBalance as NormalBalance,
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
      normalBalance: normalBalance as NormalBalance,
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

  return { ledgerId };
};
