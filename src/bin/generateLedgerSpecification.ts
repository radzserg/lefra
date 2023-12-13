import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .env('RSL')
  .usage('Usage: $0 -l [string]')
  .example('$0 -l PLATFORM_USD', 'Generates ledger configuration')
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
  })
  .parseSync();

const { databaseUrl, ledger } = argv;
// eslint-disable-next-line no-console
console.log('databaseUrl', databaseUrl);
// eslint-disable-next-line no-console
console.log('ledger', ledger);
