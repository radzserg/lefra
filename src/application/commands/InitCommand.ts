import { CommonCliOptions } from '@/application/types.js';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// eslint-disable-next-line canonical/id-match, @typescript-eslint/naming-convention
const __dirname = fileURLToPath(new URL('.', import.meta.url));

type CommandOptions = CommonCliOptions & {};

export const InitCommand = async ({ dryRun, pool }: CommandOptions) => {
  const data = await fs.readFile(__dirname + '/../../../database/schema.sql', {
    encoding: 'utf8',
  });

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('Dry run, not executing SQL:\n\n' + data);
    return;
  }

  const query = {
    parser: z.any(),
    sql: data,
    type: 'SLONIK_TOKEN_QUERY' as const,
    values: [],
  };

  await pool.query(query);
};
