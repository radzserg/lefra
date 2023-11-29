import { Transaction } from '../transaction/Transaction.js';
import { LedgerOperationError } from '@/errors.js';
import { z } from 'zod';

export type ILedgerOperation = {
  createTransaction: () => Promise<Transaction>;
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

    // If validation of the payload fails we throw an error.
    if (!result.success) {
      const issues = result.error.issues;
      const errorDetails = issues.map((issue) => issue.toString).join(', ');
      throw new LedgerOperationError(
        `Invalid operation data. Details: ${errorDetails}`,
      );
    }
  }

  public abstract createTransaction(): Promise<Transaction>;
}
