import { CommonCliOptions } from '@/application/types.js';
import { CustomLedgerSpecGenerator } from '@/ledger/codegen/CustomLedgerSpecGenerator.js';
import { PostgresLedgerStorage } from '@/ledger/storage/postgres/PostgresLedgerStorage.js';
import * as nodePath from 'node:path';
import { DatabasePool } from 'slonik';

type CommandOptions = CommonCliOptions & {
  className: string;
  ledgerSlug: string;
  path: string;
  pool: DatabasePool;
};
export const GenerateCommand = async ({
  className,
  ledgerSlug,
  path,
  pool,
}: CommandOptions) => {
  const storage = new PostgresLedgerStorage(pool);
  const realPath: string = nodePath.resolve(path);
  const generator = new CustomLedgerSpecGenerator(storage);
  await generator.generate({
    className,
    ledgerSlug,
    mode: 'file',
    path: realPath,
  });
};
