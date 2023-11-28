import { account } from '@/index.js';
import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { DoubleEntry } from '@/ledger/records/DoubleEntry.js';
import { credit, debit } from '@/ledger/records/Entry.js';
import { Transaction } from '@/ledger/records/Transaction.js';
import { moneySchema } from '@/money/validation.js';
import { INTERNAL_ID } from '@/types.js';
import { z } from 'zod';

const schema = z
  .object({
    amountLockedForCustomer: moneySchema,
    clientUserId: z.number(),
    customerUserId: z.number(),
    paymentProcessingFee: moneySchema,
    platformFee: moneySchema.nullable(),
    targetNetAmount: moneySchema,
    type: z.literal('PROJECT_STARTED'),
  })
  .strict();

type OperationSchema = typeof schema;
export type ProjectStartedOperationData = z.infer<OperationSchema>;

/**
 * Test operation -  Project starts, client pays for the project.
 * Part of money is locked for the customer. Another part is immediately
 * available for the customer to payout.
 */
export class ProjectStartedOperation implements ILedgerOperation {
  public constructor(private readonly payload: ProjectStartedOperationData) {}

  public async createTransaction(ledgerId: INTERNAL_ID): Promise<Transaction> {
    const {
      amountLockedForCustomer,
      clientUserId,
      customerUserId,
      paymentProcessingFee,
      platformFee,
      targetNetAmount,
    } = this.payload;
    const entries: DoubleEntry[] = [];
    entries.push(
      new DoubleEntry(
        debit(account('RECEIVABLES', clientUserId), targetNetAmount),
        credit(account('INCOME_PAID_PROJECTS'), targetNetAmount),
        'User owes money for the project',
      ),
      new DoubleEntry(
        debit(account('RECEIVABLES', clientUserId), paymentProcessingFee),
        credit(account('INCOME_PAYMENT_FEE'), paymentProcessingFee),
        'User owes payment processing fee',
      ),
    );

    if (platformFee) {
      entries.push(
        new DoubleEntry(
          debit(account('RECEIVABLES', clientUserId), platformFee),
          credit(account('INCOME_CONTRACT_FEES'), platformFee),
          'User owes platform fee',
        ),
      );
    }

    const amountAvailable = targetNetAmount.minus(amountLockedForCustomer);
    entries.push(
      new DoubleEntry(
        debit(account('EXPENSES_PAYOUTS'), targetNetAmount),
        // prettier-ignore
        [
          credit(account("PAYABLES_LOCKED", customerUserId), amountLockedForCustomer,),
          credit(account("PAYABLES", customerUserId), amountAvailable),
        ],
        'Part of funds are locked for the customer and part of funds are available for the customer',
      ),
    );

    return new Transaction(ledgerId, entries, 'test transaction');
  }
}
