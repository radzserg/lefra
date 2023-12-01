import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Money } from '@/money/Money.js';
import { CustomLedger } from '#/customLedger/CustomerLedger.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();
const ledger = new CustomLedger(ledgerId);
const { systemAccount, userAccount } = ledger.accountFactories();

describe('Transaction', () => {
  test('create a transaction', () => {
    const transaction = new Transaction(ledgerId, [
      doubleEntry(
        debit(userAccount('RECEIVABLES', 1), new Money(100, 'USD')),
        credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
        'User owes money for goods',
      ),
      doubleEntry(
        debit(userAccount('RECEIVABLES', 1), new Money(3, 'USD')),
        credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
        'User owes payment processing fee',
      ),
    ]);
    expect(transaction.entries).toEqual([
      debit(userAccount('RECEIVABLES', 1), new Money(100, 'USD')),
      credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
      debit(userAccount('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
    ]);
  });

  test('transaction is is assigned to all operations', () => {
    const transaction = new Transaction(ledgerId, [
      doubleEntry(
        debit(userAccount('RECEIVABLES', 1), new Money(100, 'USD')),
        credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
      ),
      doubleEntry(
        debit(userAccount('RECEIVABLES', 1), new Money(3, 'USD')),
        credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
      ),
    ]);

    expect(transaction.entries).toEqual([
      debit(userAccount('RECEIVABLES', 1), new Money(100, 'USD')),
      credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
      debit(userAccount('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
    ]);
  });
});
