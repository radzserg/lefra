/* eslint-disable no-console */

import { createDatabasePool } from '@/application/database.js';
import { randomUUID } from 'node:crypto';
import { DatabasePool, sql } from 'slonik';
import { z } from 'zod';

type TestDatabase = {
  destroy: () => Promise<void>;
  getConnectionUri: () => string;
  name: () => string;
};

type RunWithDatabaseConnectionPoolRoutine = (environment: {
  pool: DatabasePool;
  testDatabase: TestDatabase;
}) => Promise<void>;
const uid = () => {
  const databaseUid = randomUUID().split('-').pop();

  if (!databaseUid) {
    throw new Error('Expected test database UID');
  }

  return databaseUid.replaceAll(/[^\da-z]/gu, '');
};

const createTestDatabasePooler = async (pool: DatabasePool) => {
  const createTestDatabase = async (
    templateName: string,
  ): Promise<TestDatabase> => {
    const database = 'test_' + uid();

    await pool.query(sql.type(z.object({}))`
      CREATE DATABASE ${sql.identifier([database])}
      TEMPLATE ${sql.identifier([templateName])}
    `);

    return {
      destroy: async () => {
        await pool.query(sql.type(z.object({}))`
          DROP DATABASE ${sql.identifier([database])}
        `);
      },
      getConnectionUri: () => {
        return `postgresql://ledger:ledger@localhost:5473/${database}`;
      },
      name: () => {
        return database;
      },
    };
  };

  return () => {
    return createTestDatabase('ledger');
  };
};

export const runWithDatabaseConnectionPool = async (
  routine: RunWithDatabaseConnectionPoolRoutine,
): Promise<void> => {
  const pool = await globalThis.createTestPool();
  const getTestDatabase = await createTestDatabasePooler(pool);
  const testDatabase = await getTestDatabase();

  const testPool = await createDatabasePool(testDatabase.getConnectionUri());

  let caughtError;

  try {
    await routine({
      pool: testPool,
      testDatabase,
    });
  } catch (error) {
    caughtError = error;
  }

  try {
    await testPool.end();
  } catch (error) {
    console.error(error);
  }

  try {
    await testDatabase.destroy();
  } catch (error) {
    console.error(error);
  }

  if (caughtError) {
    throw caughtError;
  }
};
