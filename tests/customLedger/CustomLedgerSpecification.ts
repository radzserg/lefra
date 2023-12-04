/**
 * Ledger specification will be fetched from the database and used to generate
 * custom ledger types.
 *
 */
export const CustomLedgerSpecification = {
  entityAccountTypes: [
    'USER_PAYABLES',
    'USER_PAYABLES_LOCKED',
    'USER_RECEIVABLES',
  ] as const,
  slug: 'PLATFORM_USD',
  systemAccounts: [
    'SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA',
    'SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES',
    'SYSTEM_EXPENSES_PAYOUTS',
    'SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES',
    'SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES',
    'SYSTEM_INCOME_CONTRACT_FEES',
    'SYSTEM_INCOME_CURRENCY_CONVERSION_GAINS',
    'SYSTEM_INCOME_PAID_PROJECTS',
    'SYSTEM_INCOME_PAYMENT_FEE',
    'SYSTEM_INCOME_STRIPE_PAY_IN_FEES',
  ] as const,
};
