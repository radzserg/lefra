import { Transaction } from "../records/Transaction";

type LedgerOperation = {
  // @todo describe operation
};

export interface LedgerStorage {
  insertTransaction(transaction: Transaction): Promise<void>;
}

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
