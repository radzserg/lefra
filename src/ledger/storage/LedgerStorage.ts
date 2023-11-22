import { Transaction } from "../records/Transaction";

type LedgerOperation = {};

export interface LedgerStorage {
  saveTransaction(transaction: Transaction): Promise<void>;
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
