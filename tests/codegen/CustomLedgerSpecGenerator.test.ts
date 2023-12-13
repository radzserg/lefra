import { CustomLedgerSpecGenerator } from '@/ledger/codegen/CustomLedgerSpecGenerator.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/inMemory/InMemoryLedgerStorage.js';
import { buildCustomLedger } from '#/customLedger/buildCustomLedger.js';
import { describe, test } from 'vitest';

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
    await generator.generate({
      ledgerSlug: 'PLATFORM_USD',
    });
  });
});
