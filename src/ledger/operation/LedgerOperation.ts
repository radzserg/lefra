import { Transaction } from '../records/Transaction.js';
import { LedgerOperationError } from '@/errors.js';
import { z } from 'zod';

export type ILedgerOperation = {
  createTransaction: () => Promise<Transaction>;
};

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export abstract class LedgerOperation<TSchema extends z.ZodType>
  implements ILedgerOperation
{
  protected constructor(
    protected readonly ledgerId: string,
    schema: TSchema,
    protected readonly payload: z.infer<TSchema>,
  ) {
    const result = schema.safeParse(payload);

    // If validation of the payload fails, we capture an error in Sentry and cancel this workflow
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
