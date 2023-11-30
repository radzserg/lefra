/* eslint-disable no-console */

import { runWithDatabaseConnectionPool } from '#/helpers/createTestConnection.js';
import { sql } from 'slonik';
import { describe, test } from 'vitest';

describe('PostgresLedgerStorage', () => {
  test('fetch empty balance', async () => {
    await runWithDatabaseConnectionPool(async ({ pool }) => {
      const now = await pool.any(sql.unsafe`SELECT NOW()`);
      console.log(now);
    });
  });
});
