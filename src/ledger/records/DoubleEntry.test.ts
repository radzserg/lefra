// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-new */

import { DoubleEntry } from './DoubleEntry.js';
import { credit, debit } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { account } from '@/index.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

describe('Ledger entry', () => {
  test('debit and credit operations must have the same money amount', () => {
    expect(() => {
      new DoubleEntry(
        debit(account('Receivables', 1), new Money(100, 'USD')),
        credit(account('Expenses'), new Money(100, 'USD')),
      );
    }).not.toThrow();
  });

  test('throw an error if debit and credit operations amount are not equal', () => {
    expect(() => {
      new DoubleEntry(
        debit(account('Receivables', 1), new Money(100, 'USD')),
        credit(account('Expenses'), new Money(70, 'USD')),
      );
    }).toThrow(
      new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: $100.00, credit sum: $70.00`,
      ),
    );
  });

  test('create an entry with a comment', () => {
    const debitOperation = debit(
      account('USER_RECEIVABLES', 1),
      new Money(100, 'USD'),
    );
    const creditOperation = credit(
      account('INCOME_GOODS'),
      new Money(100, 'USD'),
    );
    const entry = new DoubleEntry(
      debitOperation,
      creditOperation,
      'User owes money for goods',
    );
    expect(entry.debitEntries).toEqual([debitOperation]);
    expect(entry.creditEntries).toEqual([creditOperation]);
    expect(entry.comment).toEqual('User owes money for goods');
  });

  test('create an entry with divided credit operation', () => {
    const debitOperation = debit(
      account('EXPENSES_PAYOUTS', 1),
      new Money(100, 'USD'),
    );
    const creditPayablesLocked = credit(
      account('PAYABLE_LOCKED'),
      new Money(70, 'USD'),
    );
    const creditPayables = credit(
      account('PAYABLE_LOCKED'),
      new Money(30, 'USD'),
    );
    const entry = new DoubleEntry(
      debitOperation,
      [creditPayablesLocked, creditPayables],
      'Platform owes $30.00 to the contractor and and owes $70.00 but it is locked',
    );

    expect(entry.debitEntries).toEqual([debitOperation]);
    expect(entry.creditEntries).toEqual([creditPayablesLocked, creditPayables]);
    expect(entry.comment).toEqual(
      'Platform owes $30.00 to the contractor and and owes $70.00 but it is locked',
    );
  });
});
