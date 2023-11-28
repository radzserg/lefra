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
    test('save system accounts', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        [account('INCOME_PAID_PROJECTS'), 'CREDIT'],
        [account('INCOME_PAYMENT_FEE'), 'CREDIT'],
      ]);

      const savedAccounts = await storage.findAccounts();

      expect(savedAccounts).toEqual([
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'SYSTEM_INCOME_PAID_PROJECTS',
          normalBalance: 'CREDIT',
          type: 'SYSTEM',
        }),
        expect.objectContaining({
          id: expect.any(String),
          ledgerId,
          name: 'SYSTEM_INCOME_PAYMENT_FEE',
          normalBalance: 'CREDIT',
          type: 'SYSTEM',
        }),
      ]);
    });

    test('save user account types', async () => {
      const storage = new InMemoryLedgerStorage();

      await storage.saveEntityAccountTypes(ledgerId, [
        ['PAYABLE_LOCKED', 'CREDIT'],
        ['RECEIVABLES', 'DEBIT'],
      ]);

      const userAccountTypes = await storage.findUserAccountTypes();
      expect(userAccountTypes).toEqual([
        {
          ledgerId,
          name: 'PAYABLE_LOCKED',
          normalBalance: 'CREDIT',
        },
        {
          ledgerId,
          name: 'RECEIVABLES',
          normalBalance: 'DEBIT',
        },
      ]);
    });

    test('cannot override existing system', async () => {
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account('INCOME_PAID_PROJECTS');
      await storage.saveAccounts(ledgerId, [[originalAccount, 'CREDIT']]);

      await expect(async () => {
        await storage.saveAccounts(ledgerId, [
          [account('INCOME_PAID_PROJECTS'), 'DEBIT'],
        ]);
      }).rejects.toThrow(
        `Account SYSTEM_INCOME_PAID_PROJECTS cannot be inserted`,
      );
    });

    test('cannot override existing user account', async () => {
      const entityId = 1;
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account('RECEIVABLES', entityId);
      await storage.saveAccounts(ledgerId, [[originalAccount, 'DEBIT']]);

      await storage.saveAccounts(ledgerId, [
        [account('RECEIVABLES', 1), 'CREDIT'],
      ]);

      const savedAccounts = await storage.findAccounts();
      expect(savedAccounts).toEqual([
        {
          entityId,
          id: originalAccount.id,
          ledgerId,
          name: 'ENTITY_RECEIVABLES',
          normalBalance: 'DEBIT',
          type: 'ENTITY',
        },
      ]);
    });
  });

  test('save transactions', async () => {
    const storage = new InMemoryLedgerStorage();
    await storage.saveAccounts(ledgerId, [
      [account('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [account('INCOME_PAYMENT_FEE'), 'CREDIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['ENTITY_RECEIVABLES', 'DEBIT'],
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
          entityId: 1,
          id: expect.any(String),
          ledgerId,
          name: 'ENTITY_RECEIVABLES',
          type: 'ENTITY',
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
