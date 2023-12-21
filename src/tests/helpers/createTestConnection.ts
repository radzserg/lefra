/* eslint-disable no-console */

import { createDatabasePool } from '@/application/database.js';
import { randomUUID } from 'node:crypto';
import { createPool, DatabasePool, sql } from 'slonik';
import { z } from 'zod';

const DATABASE_URL = 'postgresql://ledger:ledger@localhost:5473/ledger';

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

const createTestDatabasePooler = async () => {
  if (!DATABASE_URL) {
    throw new Error('Must configure DATABASE_URL to run tests.');
  }

  const pool = await createPool(DATABASE_URL, {
    connectionTimeout: 5_000,
    maximumPoolSize: 1,
  });

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
        void pool.query(sql.type(z.object({}))`
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

const getTestDatabase = await createTestDatabasePooler();

export const runWithDatabaseConnectionPool = async (
  routine: RunWithDatabaseConnectionPoolRoutine,
): Promise<void> => {
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
