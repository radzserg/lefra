import { Transaction } from '../records/Transaction.js';
import { INTERNAL_ID } from '@/types.js';

export type ILedgerOperation = {
  createTransaction: (ledgerId: INTERNAL_ID) => Promise<Transaction>;
};

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export abstract class LedgerOperation implements ILedgerOperation {
  // protected validateInput<TSchema extends z.ZodSchema>(
  //   schema: TSchema,
  //   payload: z.infer<TSchema>,
  // ) {
  //   const result = schema.safeParse(payload);
  //
  //   // If validation of the payload fails, we capture an error in Sentry and cancel this workflow
  //   if (!result.success) {
  //     const issues = result.error.issues;
  //     const errorDetails = issues.map((issue) => issue.toString).join(', ');
  //     throw new LedgerOperationError(
  //       `Invalid operation data. Details: ${errorDetails}`,
  //     );
  //   }
  // }

  public abstract createTransaction(): Promise<Transaction>;
}
