// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-new */

import { DoubleEntry } from './DoubleEntry.js';
import { credit, debit } from './Entry.js';
import { Transaction } from './Transaction.js';
import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { Money } from '@/money/Money.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

describe('Transaction', () => {
  test('create a transaction', () => {
    new Transaction(uuid(), [
      new DoubleEntry(
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(100, 'USD')),
        credit(
          new SystemLedgerAccount('INCOME_PAID_PROJECTS'),
          new Money(100, 'USD'),
        ),
        'User owes money for goods',
      ),
      new DoubleEntry(
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(3, 'USD')),
        credit(
          new SystemLedgerAccount('INCOME_PAYMENT_FEE'),
          new Money(3, 'USD'),
        ),
        'User owes payment processing fee',
      ),
    ]);
  });

  test('transaction is is assigned to all operations', () => {
    const entries = [
      debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(100, 'USD')),
      credit(
        new SystemLedgerAccount('INCOME_PAID_PROJECTS'),
        new Money(100, 'USD'),
      ),
      debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(
        new SystemLedgerAccount('INCOME_PAYMENT_FEE'),
        new Money(3, 'USD'),
      ),
    ];
    const transaction = new Transaction(uuid(), [
      new DoubleEntry(entries[0], entries[1]),
      new DoubleEntry(entries[2], entries[3]),
    ]);

    for (const entry of entries) {
      expect(entry.transactionId).toEqual(transaction.id);
    }

    expect(transaction.entries).toEqual(entries);
  });
});
