import { Transaction } from '../records/Transaction.js';
import { LedgerOperationError } from '@/errors.js';
import { DB_ID } from '@/types.js';
import { z } from 'zod';

export type ILedgerOperation = {
  createTransaction: (ledgerId: DB_ID) => Promise<Transaction>;
};

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export abstract class LedgerOperation<S extends z.ZodSchema>
  implements ILedgerOperation
{
  protected constructor(
    inputSchema: S,
    protected readonly payload: z.infer<S>,
  ) {
    const result = inputSchema.safeParse(this.payload);

    // If validation of the payload fails, we capture an error in Sentry and cancel this workflow
    if (!result.success) {
      const issues = result.error.issues;
      const errorDetails = issues.map((issue) => issue.toString).join(', ');
      throw new LedgerOperationError(
        `Invalid operation data. Details: ${errorDetails}`,
      );
    }
  }

  public abstract createTransaction(ledgerId: DB_ID): Promise<Transaction>;
}
