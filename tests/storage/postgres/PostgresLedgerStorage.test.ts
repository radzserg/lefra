import { PostgresLedgerStorage } from '@/ledger/storage/postgres/PostgresLedgerStorage.js';
import { systemAccount } from '#/customLedger/CustomerLedger.js';
import { runWithDatabaseConnectionPool } from '#/helpers/createTestConnection.js';
import { describe, expect, test } from 'vitest';

describe('PostgresLedgerStorage', () => {
  test('fetch empty balance', async () => {
    await runWithDatabaseConnectionPool(async ({ pool }) => {
      const storage = new PostgresLedgerStorage(pool);
      await expect(
        storage.fetchAccountBalance(
          '9999',
          systemAccount('INCOME_PAID_PROJECTS'),
        ),
      ).rejects.toThrow(
        'Ledger account SYSTEM_INCOME_PAID_PROJECTS is not found',
      );
    });
  });

  test('add new ledger', async () => {
    await runWithDatabaseConnectionPool(async ({ pool }) => {
      const storage = new PostgresLedgerStorage(pool);

      const usdLedgerId = await storage.insertLedger({
        currencyCode: 'USD',
        description: 'The main ledger used for My platform',
        name: 'MyComp Platform USD',
        slug: 'PLATFORM_USD',
      });
      expect(usdLedgerId).not.toBeNull();
      expect(usdLedgerId).toEqual(expect.any(Number));

      const eurLedgerId = await storage.insertLedger({
        currencyCode: 'EUR',
        description: 'EUR ledger used for My platform',
        name: 'MyComp Platform EUR',
        slug: 'PLATFORM_EUR',
      });
      expect(eurLedgerId).not.toBeNull();
      expect(eurLedgerId).toEqual(expect.any(Number));
    });
  });

  test('add new ledger account types', async () => {
    await runWithDatabaseConnectionPool(async () => {
      // const storage = new PostgresLedgerStorage(pool);
    });
  });
});
