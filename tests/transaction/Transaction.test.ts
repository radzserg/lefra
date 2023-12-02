import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { usd } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();
const userReceivables = new EntityAccountRef(
  ledgerId,
  'RECEIVABLES',
  1,
  'USER',
);
const incomePaidProjects = new SystemAccountRef(
  ledgerId,
  'INCOME_PAID_PROJECTS',
);
const incomePaymentFee = new SystemAccountRef(ledgerId, 'INCOME_PAYMENT_FEE');

describe('Transaction', () => {
  test('create a transaction', () => {
    const transaction = new Transaction(ledgerId, [
      doubleEntry(
        debit(userReceivables, usd(100)),
        credit(incomePaidProjects, usd(100)),
        'User owes money for goods',
      ),
      doubleEntry(
        debit(userReceivables, usd(3)),
        credit(incomePaymentFee, usd(3)),
        'User owes payment processing fee',
      ),
    ]);
    expect(transaction.entries).toEqual([
      debit(userReceivables, usd(100)),
      credit(incomePaidProjects, usd(100)),
      debit(userReceivables, usd(3)),
      credit(incomePaymentFee, usd(3)),
    ]);
  });

  test('transaction is is assigned to all operations', () => {
    const transaction = new Transaction(ledgerId, [
      doubleEntry(
        debit(userReceivables, usd(100)),
        credit(incomePaidProjects, usd(100)),
      ),
      doubleEntry(
        debit(userReceivables, usd(3)),
        credit(incomePaymentFee, usd(3)),
      ),
    ]);

    expect(transaction.entries).toEqual([
      debit(userReceivables, usd(100)),
      credit(incomePaidProjects, usd(100)),
      debit(userReceivables, usd(3)),
      credit(incomePaymentFee, usd(3)),
    ]);
  });
});
