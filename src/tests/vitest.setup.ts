import { createPool, DatabasePool } from 'slonik';
import { afterAll, beforeEach } from 'vitest';

const DATABASE_URL = 'postgresql://ledger:ledger@localhost:5473/ledger';
if (!DATABASE_URL) {
  throw new Error('Must configure DATABASE_URL to run tests.');
}

const testPool: {
  connected: boolean;
  pool: DatabasePool | null;
} = {
  connected: false,
  pool: null,
};

beforeEach(() => {
  globalThis.createTestPool = async () => {
    if (!testPool.connected) {
      const pool = await createPool(DATABASE_URL, {
        connectionTimeout: 5_000,
        maximumPoolSize: 1,
      });

      if (!testPool.connected) {
        testPool.pool = pool;
        testPool.connected = true;
      }
    }

    return testPool.pool;
  };
});

afterAll(async () => {
  if (testPool.connected && testPool.pool) {
    await testPool.pool.end();
  }
});
