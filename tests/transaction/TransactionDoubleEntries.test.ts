import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { DoubleEntry, doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { usd } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

const ledgerSlug = 'TEST_LEDGER';
const userReceivables = new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1);
const incomePaidProjects = new SystemAccountRef(
  ledgerSlug,
  'SYSTEM_INCOME_PAID_PROJECTS',
);
const incomePaymentFee = new SystemAccountRef(
  ledgerSlug,
  'SYSTEM_INCOME_PAYMENT_FEE',
);
describe('TransactionDoubleEntries', () => {
  test('can push entries', () => {
    const newEntries: DoubleEntry[] = [
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
    ];
    const transactionDoubleEntries = new TransactionDoubleEntries();
    transactionDoubleEntries.push(...newEntries);
    transactionDoubleEntries.push(...newEntries);
    expect(transactionDoubleEntries.entries).toEqual([
      ...newEntries,
      ...newEntries,
    ]);
    expect(transactionDoubleEntries.ledgerSlug).toEqual(ledgerSlug);
  });

  test('can append TransactionDoubleEntries', () => {
    const newEntries: DoubleEntry[] = [
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
    ];
    const transactionDoubleEntries = new TransactionDoubleEntries();
    const transactionDoubleEntries2 = new TransactionDoubleEntries();
    transactionDoubleEntries.push(...newEntries);
    transactionDoubleEntries2.push(...newEntries);
    transactionDoubleEntries.append(transactionDoubleEntries2);
    expect(transactionDoubleEntries.entries).toEqual([
      ...newEntries,
      ...newEntries,
    ]);
    expect(transactionDoubleEntries.ledgerSlug).toEqual(ledgerSlug);
  });
});
