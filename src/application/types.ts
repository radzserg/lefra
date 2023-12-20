import { DatabasePool } from 'slonik';

export type CommonCliOptions = {
  dryRun: boolean;
  pool: DatabasePool;
};
