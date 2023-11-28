import { Transaction } from '../records/Transaction.js';
import { LedgerOperationError } from '@/errors.js';
import { INTERNAL_ID } from '@/types.js';
import { z } from 'zod';

export type ILedgerOperation = {
  createTransaction: (ledgerId: INTERNAL_ID) => Promise<Transaction>;
};

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export abstract class LedgerOperation implements ILedgerOperation {
  protected inputSchema: z.ZodSchema = z.any();

  protected constructor(protected readonly payload: unknown) {}

  protected validatePayload(): void {
    if (this.inputSchema) {
      const result = this.inputSchema.safeParse(this.payload);

      // If validation of the payload fails, we capture an error in Sentry and cancel this workflow
      if (!result.success) {
        const issues = result.error.issues;
        const errorDetails = issues.map((issue) => issue.toString).join(', ');
        throw new LedgerOperationError(
          `Invalid operation data. Details: ${errorDetails}`,
        );
      }
    }
  }

  public abstract createTransaction(
    ledgerId: INTERNAL_ID,
  ): Promise<Transaction>;
}
