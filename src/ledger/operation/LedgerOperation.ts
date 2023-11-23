import { Transaction } from "../records/Transaction";
import { DoubleEntry } from "../records/DoubleEntry";
import { credit, debit } from "../records/Entry";
import { usd } from "../../money/Money";
import { account } from "../../index";

/**
 * LedgerOperation describes how ledger transaction should be created.
 * It defines logic based on the business rules.
 */
export interface LedgerOperation {
  createTransaction(): Promise<Transaction>;
}

class ProjectStartedOperation implements LedgerOperation {
  public constructor(private readonly ledgerId: string) {}

  public async createTransaction(): Promise<Transaction> {
    const entries: DoubleEntry[] = [];
    entries.push(
      new DoubleEntry(
        debit(account("RECEIVABLES", 1), usd(100)),
        credit(account("INCOME_PAID_PROJECTS"), usd(100)),
        "User owes money for goods",
      ),
    );
    entries.push(
      new DoubleEntry(
        debit(account("RECEIVABLES", 1), usd(3)),
        credit(account("INCOME_PAYMENT_FEE"), usd(3)),
        "User owes payment processing fee",
      ),
    );

    return new Transaction(this.ledgerId, entries, "test transaction");
  }
}

/*
export interface Ledger {
  // @todo describe ledger
  record(operation: LedgerOperation): Promise<void>;
}

/*
    entries.push(
      ['DEBIT', payment.targetNetAmount, ClientReceivables(client)],
      ['CREDIT', payment.targetNetAmount, System('INCOME_PAID_PROJECTS')],

      ['DEBIT', payment.targetNetAmount, System('EXPENSES_PAYOUTS')],
      ['CREDIT', amountLocked, User('PAYABLES_LOCKED', contractor.userAccountId)]
      ['CREDIT', amountAvailable, User('PAYABLES', contractor.userAccountId)]
    );
  }
 */

/*
 const entries: Array<LedgerTransactionEntry<'USD'>> = [];

  const contraPlatformFee = payment.contraPlatformFee;
  if (contraPlatformFee) {
    const targetNetAmountWithoutPlatformFee = payment.targetNetAmount.minus(
      contraPlatformFee.netAmount,
    );

    // prettier-ignore
    entries.push(
      ['DEBIT', targetNetAmountWithoutPlatformFee, ClientReceivables(client)],
      ['CREDIT', targetNetAmountWithoutPlatformFee, System('INCOME_PAID_PROJECTS')],
      ['DEBIT', targetNetAmountWithoutPlatformFee, System('EXPENSES_PAYOUTS')],

      ['DEBIT', contraPlatformFee.chargeAmount, ClientReceivables(client)],
      ['CREDIT', contraPlatformFee.chargeAmount, System('INCOME_CONTRACT_FEES')],
    );
  } else {
    entries.push(
      ['DEBIT', payment.targetNetAmount, ClientReceivables(client)],
      ['CREDIT', payment.targetNetAmount, System('INCOME_PAID_PROJECTS')],
      ['DEBIT', payment.targetNetAmount, System('EXPENSES_PAYOUTS')],
    );
  }

  if (amountLocked.isPositive()) {
    // prettier-ignore
    entries.push(['CREDIT', amountLocked, User('PAYABLES_LOCKED', contractor.userAccountId)]);
  }

  if (amountAvailable.isPositive()) {
    // prettier-ignore
    entries.push(['CREDIT', amountAvailable, User('PAYABLES', contractor.userAccountId)]);
  }

  if (payment.status === 'CONFIRMED') {
    entries.push(
      ...entriesForPaymentConfirmed({
        client,
        payment,
      }),
    );
  }

  return entries;
  */
