import { LedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { databaseIdSchema } from '@/ledger/storage/validation.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { usdSchema } from '@/money/validation.js';
import { customLedgerAccountFactory } from '#/customLedger/customLedgerAccountFactory.js';
import { paymentSchema } from '#/customLedger/importedTypes.js';
import { entriesForPaymentConfirmed } from '#/customLedger/operations/paymentConfirmed.js';
import { z } from 'zod';

const schema = z
  .object({
    amountLockedForContractor: usdSchema,
    clientUserId: z.number(),
    contractorUserId: z.number(),
    ledgerId: databaseIdSchema,
    payment: paymentSchema,
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
      amountLockedForContractor,
      clientUserId,
      contractorUserId,
      ledgerId,
      payment,
    } = this.payload;

    const { systemAccount, userAccount } = customLedgerAccountFactory(ledgerId);
    const { platformFee } = payment;
    const entries = new TransactionDoubleEntries();

    const targetNetAmountWithoutPlatformFee = platformFee
      ? payment.targetNetAmount.minus(platformFee.netAmount)
      : payment.targetNetAmount;

    entries.push(
      doubleEntry(
        debit(
          userAccount('RECEIVABLES', clientUserId),
          targetNetAmountWithoutPlatformFee,
        ),
        credit(
          systemAccount('INCOME_PAID_PROJECTS'),
          targetNetAmountWithoutPlatformFee,
        ),
        'User owes money for the project',
      ),
    );

    if (platformFee) {
      entries.push(
        doubleEntry(
          debit(
            userAccount('RECEIVABLES', clientUserId),
            platformFee.chargeAmount,
          ),
          credit(
            systemAccount('INCOME_CONTRACT_FEES'),
            platformFee.chargeAmount,
          ),
          'User owes platform fee',
        ),
      );
    }

    const amountAvailable = targetNetAmountWithoutPlatformFee.minus(
      amountLockedForContractor,
    );
    entries.push(
      doubleEntry(
        debit(
          systemAccount('EXPENSES_PAYOUTS'),
          targetNetAmountWithoutPlatformFee,
        ),
        // prettier-ignore
        [
          credit(userAccount("PAYABLES_LOCKED", contractorUserId), amountLockedForContractor,),
          credit(userAccount("PAYABLES", contractorUserId), amountAvailable),
        ],
        'Part of funds are locked for the customer and part of funds are available for the customer',
      ),
    );

    if (payment.status === 'CONFIRMED') {
      entries.append(
        entriesForPaymentConfirmed({
          clientUserId,
          payment,
          systemAccount,
          userAccount,
        }),
      );
    }

    return new Transaction(ledgerId, entries, 'test transaction');
  }
}
