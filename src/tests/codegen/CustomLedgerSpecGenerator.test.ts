import { CustomLedgerSpecGenerator } from '@/ledger/codegen/CustomLedgerSpecGenerator.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/inMemory/InMemoryLedgerStorage.js';
import { buildCustomLedger } from '#/customLedger/buildCustomLedger.js';
import { describe, expect, test } from 'vitest';

const createServices = async () => {
  const storage = new InMemoryLedgerStorage();

  return {
    storage,
  };
};

describe('CustomLedgerSpecGenerator', () => {
  test('build ledger spec', async () => {
    const { storage } = await createServices();
    await buildCustomLedger(storage);

    const generator = new CustomLedgerSpecGenerator(storage);
    const spec = await generator.generate({
      className: 'MyCompanyLedgerSpecification',
      ledgerSlug: 'PLATFORM_USD',
      mode: 'output',
    });
    expect(spec).toEqual(
      `export const MyCompanyLedgerSpecification = {
  currencyCode: 'USD',
  entityAccountTypes: [
    'USER_PAYABLES',
    'USER_PAYABLES_LOCKED',
    'USER_RECEIVABLES'
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
    'SYSTEM_INCOME_STRIPE_PAY_IN_FEES'
  ] as const,
};
`,
    );
  });
});
