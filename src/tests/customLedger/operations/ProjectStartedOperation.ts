import { LedgerOperationError } from '@/errors.js';
import { ledgerAccountsRefBuilder } from '@/ledger/accounts/ledgerAccountsRefBuilder.js';
import { ILedgerOperation } from '@/ledger/operation/LedgerOperation.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { CustomLedgerSpecification } from '#/customLedger/CustomLedgerSpecification.js';
import { paymentSchema } from '#/customLedger/importedTypes.js';
import { entriesForPaymentConfirmed } from '#/customLedger/operations/paymentConfirmed.js';
import { usdSchema } from '#/customLedger/validation.js';
import { z } from 'zod';

const schema = z
  .object({
    amountLockedForContractor: usdSchema,
    clientUserId: z.number(),
    contractorUserId: z.number(),
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
export class ProjectStartedOperation implements ILedgerOperation {
  public constructor(private readonly payload: ProjectStartedOperationData) {
    const result = schema.safeParse(this.payload);

    // If validation of the payload fails we throw an error.
    if (!result.success) {
      const issues = result.error.issues;
      const errorDetails = issues.map((issue) => issue.toString).join(', ');
      throw new LedgerOperationError(
        `Invalid operation data. Details: ${errorDetails}`,
      );
    }
  }

  public async createTransaction() {
    const {
      amountLockedForContractor,
      clientUserId,
      contractorUserId,
      payment,
    } = this.payload;

    const account = ledgerAccountsRefBuilder(CustomLedgerSpecification);

    const { platformFee } = payment;
    const entries = TransactionDoubleEntries.empty<'USD'>();

    const targetNetAmountWithoutPlatformFee = platformFee
      ? payment.targetNetAmount.minus(platformFee.netAmount)
      : payment.targetNetAmount;

    entries.push(
      doubleEntry(
        debit(
          account('USER_RECEIVABLES', clientUserId),
          targetNetAmountWithoutPlatformFee,
        ),
        credit(
          account('SYSTEM_INCOME_PAID_PROJECTS'),
          targetNetAmountWithoutPlatformFee,
        ),
        'User owes money for the project',
      ),
    );

    if (platformFee) {
      entries.push(
        doubleEntry(
          debit(
            account('USER_RECEIVABLES', clientUserId),
            platformFee.chargeAmount,
          ),
          credit(
            account('SYSTEM_INCOME_CONTRACT_FEES'),
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
          account('SYSTEM_EXPENSES_PAYOUTS'),
          targetNetAmountWithoutPlatformFee,
        ),
        [
          credit(
            account('USER_PAYABLES_LOCKED', contractorUserId),
            amountLockedForContractor,
          ),
          credit(account('USER_PAYABLES', contractorUserId), amountAvailable),
        ],
        'Part of funds are locked for the customer and part of funds are available for the customer',
      ),
    );

    if (payment.status === 'CONFIRMED') {
      entries.append(
        entriesForPaymentConfirmed({
          clientUserId,
          payment,
        }),
      );
    }

    return new Transaction(entries, 'test transaction');
  }
}
