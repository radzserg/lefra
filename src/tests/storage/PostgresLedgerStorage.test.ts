import { PostgresLedgerStorage } from '@/ledger/storage/postgres/PostgresLedgerStorage.js';
import { runWithDatabaseConnectionPool } from '#/helpers/createTestConnection.js';
import { describe, expect, test } from 'vitest';

/**
 * This test suite contains only specific tests for PostgresLedgerStorage.
 *
 * Tests for LedgerStorage are in src/tests/storage/LedgerStorage.test.ts.
 */
describe('PostgresLedgerStorage', () => {
  test('run storage providing DatabasePool object ', async () => {
    await runWithDatabaseConnectionPool(async ({ pool }) => {
      const storage = new PostgresLedgerStorage(pool);

      const currency = await storage.insertCurrency({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      expect(currency).toMatchObject({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
    });
  });

  test('run storage providing DatabasePool connection string ', async () => {
    await runWithDatabaseConnectionPool(async ({ testDatabase }) => {
      const storage = new PostgresLedgerStorage(
        testDatabase.getConnectionUri(),
        {
          maximumPoolSize: 1,
        },
      );

      const currencyUsd = await storage.insertCurrency({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      expect(currencyUsd).toMatchObject({
        code: 'USD',
        id: expect.any(Number),
        minimumFractionDigits: 2,
        symbol: '$',
      });
      await storage.end();
    });
  });

  test('end connection', async () => {
    await runWithDatabaseConnectionPool(async ({ testDatabase }) => {
      const storage = new PostgresLedgerStorage(
        testDatabase.getConnectionUri(),
        {
          maximumPoolSize: 1,
        },
      );

      const currencyUsd = await storage.insertCurrency({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      expect(currencyUsd).toMatchObject({
        code: 'USD',
        id: expect.any(Number),
        minimumFractionDigits: 2,
        symbol: '$',
      });
      await storage.end();
    });
  });

  test('ensure correct connection string is provided', async () => {
    const connection = null;
    await expect(async () => {
      // eslint-disable-next-line no-new, @typescript-eslint/no-non-null-assertion
      new PostgresLedgerStorage(connection!);
    }).rejects.toThrow('Connection string is required');

    await expect(async () => {
      // eslint-disable-next-line no-new
      new PostgresLedgerStorage('');
    }).rejects.toThrow('Connection string is required');
  });
});
