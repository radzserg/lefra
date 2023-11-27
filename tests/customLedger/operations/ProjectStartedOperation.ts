import { z } from "zod";
import { moneySchema } from "../../../src/money/validation.js";
import { LedgerOperation } from "../../../src/ledger/operation/LedgerOperation.js";
import { Transaction } from "../../../src/ledger/records/Transaction.js";
import { DoubleEntry } from "../../../src/ledger/records/DoubleEntry.js";
import { credit, debit } from "../../../src/ledger/records/Entry.js";
import { account } from "../../../src/index.js";

const schema = z
  .object({
    targetNetAmount: moneySchema,
    platformFee: moneySchema.nullable(),
    amountLockedForCustomer: moneySchema,
    paymentProcessingFee: moneySchema,
    clientUserId: z.number(),
    customerUserId: z.number(),
  })
  .strict();

type OperationSchema = typeof schema;
export type ProjectStartedOperationData = z.infer<OperationSchema>;

/**
 * Test operation -  Project starts, client pays for the project.
 * Part of money is locked for the customer. Another part is immediately
 * available for the customer to payout.
 */
export class ProjectStartedOperation extends LedgerOperation<OperationSchema> {
  public constructor(
    protected readonly ledgerId: string,
    payload: ProjectStartedOperationData,
  ) {
    super(ledgerId, schema, payload);
  }

  public async createTransaction(): Promise<Transaction> {
    const {
      clientUserId,
      platformFee,
      amountLockedForCustomer,
      paymentProcessingFee,
      customerUserId,
      targetNetAmount,
    } = this.payload;
    const entries: DoubleEntry[] = [];
    entries.push(
      new DoubleEntry(
        debit(account("RECEIVABLES", clientUserId), targetNetAmount),
        credit(account("INCOME_PAID_PROJECTS"), targetNetAmount),
        "User owes money for the project",
      ),
      new DoubleEntry(
        debit(account("RECEIVABLES", clientUserId), paymentProcessingFee),
        credit(account("INCOME_PAYMENT_FEE"), paymentProcessingFee),
        "User owes payment processing fee",
      ),
    );

    if (platformFee) {
      entries.push(
        new DoubleEntry(
          debit(account("RECEIVABLES", clientUserId), platformFee),
          credit(account("INCOME_CONTRACT_FEES"), platformFee),
          "User owes platform fee",
        ),
      );
    }

    const amountAvailable = targetNetAmount.minus(amountLockedForCustomer);
    entries.push(
      new DoubleEntry(
        debit(account("EXPENSES_PAYOUTS"), targetNetAmount),
        // prettier-ignore
        [
          credit(account("PAYABLES_LOCKED", customerUserId), amountLockedForCustomer,),
          credit(account("PAYABLES", customerUserId), amountAvailable),
        ],
        "Part of funds are locked for the customer and part of funds are available for the customer",
      ),
    );

    return new Transaction(this.ledgerId, entries, "test transaction");
  }
}
