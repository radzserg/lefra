import { LedgerError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { cad, usd } from '#/helpers/units.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();

describe('Ledger entry', () => {
  test('debit and credit operations must have the same money amount', () => {
    expect(() => {
      doubleEntry(
        debit(new EntityAccountRef(ledgerId, 'RECEIVABLES', 1), usd(100)),
        credit(new SystemAccountRef(ledgerId, 'EXPENSES'), usd(100)),
      );
    }).not.toThrow();
  });

  test('throw an error if operations have different units', () => {
    expect(() => {
      doubleEntry(
        debit(new EntityAccountRef(ledgerId, 'RECEIVABLES', 1), cad(100)),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        credit(new SystemAccountRef(ledgerId, 'EXPENSES'), usd(100)),
      );
    }).toThrow(
      'Debit and credit operations must have the same currency. Debit currency: CAD, credit currency: USD',
    );
  });

  test('throw an error if debit and credit operations amount are not equal', () => {
    expect(() => {
      doubleEntry(
        debit(new EntityAccountRef(ledgerId, 'RECEIVABLES', 1), usd(100)),
        credit(new SystemAccountRef(ledgerId, 'EXPENSES'), usd(70)),
      );
    }).toThrow(
      new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: USD:100.00, credit sum: USD:70.00 Entries:
DEBIT  USD:100.00 RECEIVABLES:1`,
      ),
    );
  });

  test('create an entry with a comment', () => {
    const debitOperation = debit(
      new EntityAccountRef(ledgerId, 'RECEIVABLES', 1),
      usd(100),
    );
    const creditOperation = credit(
      new SystemAccountRef(ledgerId, 'INCOME_GOODS'),
      usd(100),
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
      usd(100),
    );
    const creditPayablesLocked = credit(
      new SystemAccountRef(ledgerId, 'PAYABLES_LOCKED'),
      usd(70),
    );
    const creditPayables = credit(
      new SystemAccountRef(ledgerId, 'PAYABLES_LOCKED'),
      usd(30),
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
