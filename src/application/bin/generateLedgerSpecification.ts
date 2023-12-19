import { createDatabasePool } from '@/application/database.js';
import { CustomLedgerSpecGenerator } from '@/ledger/codegen/CustomLedgerSpecGenerator.js';
import { PostgresLedgerStorage } from '@/ledger/storage/postgres/PostgresLedgerStorage.js';
import * as nodePath from 'node:path';
import { DatabasePool } from 'slonik';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .env('LFR')
  .usage('Usage: $0 -l [string]')
  .example(
    'generate -l PLATFORM_USD -p ./MyLedger.ts',
    'Generates ledger configuration',
  )
  .options({
    databaseUrl: {
      alias: 'd',
      demandOption: true,
      description: 'Database URL',
      type: 'string',
    },
    ledger: {
      alias: 'l',
      demandOption: true,
      description: 'Unique ledger slug',
      type: 'string',
    },
    path: {
      alias: 'p',
      demandOption: true,
      description: 'Path to save file',
      type: 'string',
    },
  })
  .parseSync();

(async () => {
  let pool: DatabasePool;
  try {
    const { databaseUrl, ledger, path } = argv;
    pool = await createDatabasePool(databaseUrl);
    const storage = new PostgresLedgerStorage(pool);

    const realPath: string = nodePath.resolve(path);
    const generator = new CustomLedgerSpecGenerator(storage);
    await generator.generate({
      className: 'MyCompanyLedgerSpecification',
      ledgerSlug: ledger,
      mode: 'file',
      path: realPath,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (pool) {
      await pool.end();
    }
  }
})();
