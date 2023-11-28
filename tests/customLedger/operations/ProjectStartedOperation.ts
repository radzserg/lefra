import { LedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { DoubleEntry, doubleEntry } from '@/ledger/records/DoubleEntry.js';
import { credit, debit } from '@/ledger/records/Entry.js';
import { Transaction } from '@/ledger/records/Transaction.js';
import { moneySchema } from '@/money/validation.js';
import { systemAccount, userAccount } from '#/customLedger/CustomerLedger.js';
import { z } from 'zod';

const schema = z
  .object({
    amountLockedForCustomer: moneySchema,
    clientUserId: z.number(),
    customerUserId: z.number(),
    paymentProcessingFee: moneySchema,
    platformFee: moneySchema.nullable(),
    targetNetAmount: moneySchema,
  })
  .strict();

type OperationSchema = typeof schema;
export type ProjectStartedOperationData = z.infer<OperationSchema>;

/**
 * Test operation -  Project starts, client pays for the project.
 * Part of money is locked for the customer. Another part is immediately
 * available for the customer to payout.
 */
export class ProjectStartedOperation extends LedgerOperation<typeof schema> {
  protected declare payload: ProjectStartedOperationData;

  public constructor(payload: ProjectStartedOperationData) {
    super(schema, payload);
  }

  public async createTransaction(): Promise<Transaction> {
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
      doubleEntry(
        debit(userAccount('RECEIVABLES', clientUserId), targetNetAmount),
        credit(systemAccount('INCOME_PAID_PROJECTS'), targetNetAmount),
        'User owes money for the project',
      ),
      doubleEntry(
        debit(userAccount('RECEIVABLES', clientUserId), paymentProcessingFee),
        credit(systemAccount('INCOME_PAYMENT_FEE'), paymentProcessingFee),
        'User owes payment processing fee',
      ),
    );

    if (platformFee) {
      entries.push(
        doubleEntry(
          debit(userAccount('RECEIVABLES', clientUserId), platformFee),
          credit(systemAccount('INCOME_CONTRACT_FEES'), platformFee),
          'User owes platform fee',
        ),
      );
    }

    const amountAvailable = targetNetAmount.minus(amountLockedForCustomer);
    entries.push(
      doubleEntry(
        debit(systemAccount('EXPENSES_PAYOUTS'), targetNetAmount),
        // prettier-ignore
        [
          credit(userAccount("PAYABLE_LOCKED", customerUserId), amountLockedForCustomer,),
          credit(userAccount("PAYABLE", customerUserId), amountAvailable),
        ],
        'Part of funds are locked for the customer and part of funds are available for the customer',
      ),
    );

    return new Transaction(entries, 'test transaction');
  }
}
