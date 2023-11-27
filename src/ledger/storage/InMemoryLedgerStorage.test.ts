import { DoubleEntry } from '../records/DoubleEntry.js';
import { credit, debit } from '../records/Entry.js';
import { Transaction } from '../records/Transaction.js';
import { InMemoryLedgerStorage } from './InMemoryStorage.js';
import { account } from '@/index.js';
import { Money } from '@/money/Money.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

const ledgerId = uuid();

describe('InMemoryLedgerStorage', () => {
  describe('save accounts', () => {
    test('save accounts', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        account('INCOME_PAID_PROJECTS'),
        account('INCOME_PAYMENT_FEE'),
        account('PAYABLES_LOCKED', 1),
      ]);

      const savedAccounts = await storage.findAccounts();

      expect(savedAccounts).toEqual([
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'INCOME_PAID_PROJECTS',
        }),
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'INCOME_PAYMENT_FEE',
        }),
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'PAYABLES_LOCKED',
        }),
      ]);
    });

    test('cannot override existing system', async () => {
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account('INCOME_PAID_PROJECTS');
      await storage.saveAccounts(ledgerId, [originalAccount]);

      await expect(async () => {
        await storage.saveAccounts(ledgerId, [account('INCOME_PAID_PROJECTS')]);
      }).rejects.toThrow(
        `Account SYSTEM_INCOME_PAID_PROJECTS cannot be inserted`,
      );
    });

    test('cannot override existing user account', async () => {
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account('RECEIVABLES', 1);
      await storage.saveAccounts(ledgerId, [originalAccount]);
      await storage.saveAccounts(ledgerId, [account('RECEIVABLES', 1)]);

      const savedAccounts = await storage.findAccounts();
      expect(savedAccounts).toEqual([
        {
          ...originalAccount,
          canBeInserted: undefined,
          ledgerId,
          type: 'USER',
        },
      ]);
    });
  });

  test('save transactions', async () => {
    const storage = new InMemoryLedgerStorage();
    await storage.saveAccounts(ledgerId, [
      account('INCOME_PAID_PROJECTS'),
      account('INCOME_PAYMENT_FEE'),
    ]);

    const transaction = new Transaction(
      ledgerId,
      [
        new DoubleEntry(
          debit(account('RECEIVABLES', 1), new Money(100, 'USD')),
          credit(account('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
          'User owes money for goods',
        ),
        new DoubleEntry(
          debit(account('RECEIVABLES', 1), new Money(3, 'USD')),
          credit(account('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
          'User owes payment processing fee',
        ),
      ],
      'test transaction',
    );

    await storage.insertTransaction(transaction);

    const savedAccounts = await storage.findAccounts();

    // expect that we dynamically created the account
    expect(savedAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'RECEIVABLES',
          type: 'USER',
          userAccountId: 1,
        }),
      ]),
    );

    const entries = await storage.findEntries();

    expect(entries).toEqual([
      expect.objectContaining({
        accountId: expect.any(String),
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: transaction.id,
        type: 'DEBIT',
      }),
      expect.objectContaining({
        accountId: expect.any(String),
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: transaction.id,
        type: 'CREDIT',
      }),
      expect.objectContaining({
        accountId: expect.any(String),
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: transaction.id,
        type: 'DEBIT',
      }),
      expect.objectContaining({
        accountId: expect.any(String),
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: transaction.id,
        type: 'CREDIT',
      }),
    ]);

    const transactions = await storage.findTransactions();
    expect(transactions).toEqual([
      {
        description: 'test transaction',
        id: transaction.id,
        ledgerId,
      },
    ]);
  });
});
