import { DB_ID } from '@/types.js';
import { z } from 'zod';

export const databaseIdSchema = z.custom<DB_ID>((value) => {
  return (
    value instanceof String ||
    typeof value === 'string' ||
    value instanceof Number ||
    typeof value === 'number'
  );
});
