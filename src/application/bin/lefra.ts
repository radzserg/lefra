import { GenerateCommand } from '@/application/commands/GenerateCommand.js';
import { InitCommand } from '@/application/commands/InitCommand.js';
import { createDatabasePool } from '@/application/database.js';
import { DatabasePool } from 'slonik';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

let pool: DatabasePool;

const mainCommand = yargs(hideBin(process.argv))
  .env('LFR')
  .usage('Usage: pnpm do <command>')
  .strictCommands()
  .demandCommand(1)
  .options({
    databaseUrl: {
      alias: 'd',
      demandOption: true,
      description:
        'Database URL postgres://postgres:postgres@localhost:5432/lefra',
      type: 'string',
    },
    dryRun: {
      default: false,
      description: 'Do not execute commands and only show generated SQL',
      type: 'boolean',
    },
  })
  .help()
  .command(
    'init',
    'init database structure',
    (ya) => {
      return ya.example(
        'lefra -d postgres://postgres:postgres@localhost:5432/lefra',
        'Init database structure',
      );
    },
    async ({ databaseUrl, ...options }) => {
      pool = await createDatabasePool(databaseUrl);
      await InitCommand({ pool, ...options });
    },
  )
  .command(
    'generate',
    'generate ledger specification',
    (ya) => {
      return ya
        .options({
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
        .example(
          'lefra -d postgres://postgres:postgres@localhost:5432/lefra',
          'Generates database structure for the ledger',
        );
    },
    async ({ databaseUrl, ...options }) => {
      pool = await createDatabasePool(databaseUrl);
      await GenerateCommand({ pool, ...options });
    },
  );

setTimeout(async () => {
  try {
    await mainCommand.fail(false).parse();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}, 0);
