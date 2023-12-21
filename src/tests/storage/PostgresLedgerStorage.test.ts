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
      );

      const currencyUsd = await storage.insertCurrency({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      expect(currencyUsd).toMatchObject({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
    });
  });

  test('end connection', async () => {
    await runWithDatabaseConnectionPool(async ({ testDatabase }) => {
      const storage = new PostgresLedgerStorage(
        testDatabase.getConnectionUri(),
      );

      const currencyUsd = await storage.insertCurrency({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      expect(currencyUsd).toMatchObject({
        code: 'USD',
        minimumFractionDigits: 2,
        symbol: '$',
      });
      await storage.end();
    });
  });
});
