import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { cad, usd } from '#/helpers/units.js';
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
    const newEntries = [
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
    const transactionDoubleEntries = new TransactionDoubleEntries(newEntries);
    transactionDoubleEntries.push(...newEntries);
    expect(transactionDoubleEntries.entries).toEqual([
      ...newEntries,
      ...newEntries,
    ]);
    expect(transactionDoubleEntries.ledgerSlug).toEqual(ledgerSlug);
  });

  test('can not push entries with different unit', () => {
    const transactionDoubleEntries = new TransactionDoubleEntries([
      doubleEntry(
        debit(userReceivables, usd(100)),
        credit(incomePaidProjects, usd(100)),
        'User owes money for goods',
      ),
    ]);

    transactionDoubleEntries.push(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      doubleEntry(
        debit(userReceivables, cad(100)),
        credit(incomePaidProjects, cad(100)),
        'User owes money for goods',
      ),
    );
  });

  test('can append TransactionDoubleEntries', () => {
    const newEntries = [
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
    const transactionDoubleEntries = new TransactionDoubleEntries(newEntries);
    const transactionDoubleEntries2 = new TransactionDoubleEntries(newEntries);
    transactionDoubleEntries.append(transactionDoubleEntries2);
    expect(transactionDoubleEntries.entries).toEqual([
      ...newEntries,
      ...newEntries,
    ]);
    expect(transactionDoubleEntries.ledgerSlug).toEqual(ledgerSlug);
  });

  test('validate entries', () => {
    expect(() => {
      doubleEntry(
        debit(userReceivables, usd(0)),
        credit(incomePaidProjects, usd(0)),
      );
    }).toThrow('Cannot create entry with zero amount');
  });

  test('filter zero entries', () => {
    const entry = doubleEntry(debit(userReceivables, usd(50)), [
      credit(incomePaidProjects, usd(50)),
      credit(incomePaidProjects, usd(0)).mayHaveZero(),
    ]);

    expect(entry.creditEntries).toEqual([credit(incomePaidProjects, usd(50))]);
  });
});
