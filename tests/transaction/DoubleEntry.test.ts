import { LedgerError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();

describe('Ledger entry', () => {
  test('debit and credit operations must have the same money amount', () => {
    expect(() => {
      doubleEntry(
        debit(
          new EntityAccountRef(ledgerId, 'RECEIVABLES', 1),
          new Money(100, 'USD'),
        ),
        credit(
          new SystemAccountRef(ledgerId, 'EXPENSES'),
          new Money(100, 'USD'),
        ),
      );
    }).not.toThrow();
  });

  test('throw an error if debit and credit operations amount are not equal', () => {
    expect(() => {
      doubleEntry(
        debit(
          new EntityAccountRef(ledgerId, 'RECEIVABLES', 1),
          new Money(100, 'USD'),
        ),
        credit(
          new SystemAccountRef(ledgerId, 'EXPENSES'),
          new Money(70, 'USD'),
        ),
      );
    }).toThrow(
      new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: $100.00, credit sum: $70.00 Entries:
DEBIT  $100.00 ENTITY_RECEIVABLES:1`,
      ),
    );
  });

  test('create an entry with a comment', () => {
    const debitOperation = debit(
      new EntityAccountRef(ledgerId, 'RECEIVABLES', 1),
      new Money(100, 'USD'),
    );
    const creditOperation = credit(
      new SystemAccountRef(ledgerId, 'INCOME_GOODS'),
      new Money(100, 'USD'),
    );
    const entry = doubleEntry(
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
      new SystemAccountRef(ledgerId, 'EXPENSES_PAYOUTS'),
      new Money(100, 'USD'),
    );
    const creditPayablesLocked = credit(
      new SystemAccountRef(ledgerId, 'PAYABLE_LOCKED'),
      new Money(70, 'USD'),
    );
    const creditPayables = credit(
      new SystemAccountRef(ledgerId, 'PAYABLE_LOCKED'),
      new Money(30, 'USD'),
    );
    const entry = doubleEntry(
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
