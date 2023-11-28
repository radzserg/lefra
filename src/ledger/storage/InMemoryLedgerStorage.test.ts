import { DoubleEntry } from '../records/DoubleEntry.js';
import { credit, debit } from '../records/Entry.js';
import { Transaction } from '../records/Transaction.js';
import { InMemoryLedgerStorage } from './InMemoryStorage.js';
import { entityAccount } from '@/ledger/accounts/LedgerAccount.js';
import { Money } from '@/money/Money.js';
import { systemAccount, userAccount } from '#/customLedger/CustomerLedger.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

const UUID_REGEX = /^[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}$/u;

const ledgerId = uuid();

describe('InMemoryLedgerStorage', () => {
  describe('save accounts', () => {
    test('save system accounts', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        [systemAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
        [systemAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
      ]);

      const savedAccounts = await storage.findAccounts();

      expect(savedAccounts).toEqual([
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
          ledgerId,
          name: 'SYSTEM_INCOME_PAID_PROJECTS',
          normalBalance: 'CREDIT',
          type: 'SYSTEM',
        }),
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
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
      const originalAccount = systemAccount('INCOME_PAID_PROJECTS');
      await storage.saveAccounts(ledgerId, [[originalAccount, 'CREDIT']]);

      await expect(async () => {
        await storage.saveAccounts(ledgerId, [
          [systemAccount('INCOME_PAID_PROJECTS'), 'DEBIT'],
        ]);
      }).rejects.toThrow(
        `Account SYSTEM_INCOME_PAID_PROJECTS is system and already exists.`,
      );
    });

    test('cannot override existing user account', async () => {
      const entityId = 1;
      const storage = new InMemoryLedgerStorage();
      const originalAccount = userAccount('RECEIVABLES', entityId);
      await storage.saveAccounts(ledgerId, [[originalAccount, 'DEBIT']]);

      await storage.saveAccounts(ledgerId, [
        [userAccount('RECEIVABLES', 1), 'CREDIT'],
      ]);

      const savedAccounts = await storage.findAccounts();
      expect(savedAccounts).toEqual([
        {
          entityId,
          id: expect.stringMatching(UUID_REGEX),
          ledgerId,
          name: 'USER_RECEIVABLES',
          normalBalance: 'DEBIT',
          type: 'ENTITY',
        },
      ]);
    });
  });

  test('save transactions', async () => {
    const storage = new InMemoryLedgerStorage();
    await storage.saveAccounts(ledgerId, [
      [systemAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [systemAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['ENTITY_RECEIVABLES', 'DEBIT'],
    ]);

    const transaction = new Transaction(
      [
        new DoubleEntry(
          debit(entityAccount('RECEIVABLES', 1), new Money(100, 'USD')),
          credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
          'User owes money for goods',
        ),
        new DoubleEntry(
          debit(entityAccount('RECEIVABLES', 1), new Money(3, 'USD')),
          credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
          'User owes payment processing fee',
        ),
      ],
      'test transaction',
    );

    await storage.insertTransaction(ledgerId, transaction);

    const savedAccounts = await storage.findAccounts();

    // expect that we dynamically created the account
    expect(savedAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: 1,
          id: expect.stringMatching(UUID_REGEX),
          ledgerId,
          name: 'ENTITY_RECEIVABLES',
          type: 'ENTITY',
        }),
      ]),
    );

    const entries = await storage.findEntries();

    expect(entries).toEqual([
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        action: 'DEBIT',
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        action: 'CREDIT',
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        action: 'DEBIT',
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        action: 'CREDIT',
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
      }),
    ]);

    const transactions = await storage.findTransactions();
    expect(transactions).toEqual([
      {
        description: 'test transaction',
        id: expect.stringMatching(UUID_REGEX),
        ledgerId,
      },
    ]);
  });

  describe('fetch account balance', () => {
    test('throw an error if ledger account does not exist', async () => {
      const storage = new InMemoryLedgerStorage();

      await expect(async () => {
        await storage.fetchAccountBalance(
          ledgerId,
          systemAccount('INCOME_PAID_PROJECTS'),
        );
      }).rejects.toThrow('Account SYSTEM_INCOME_PAID_PROJECTS not found');
    });

    test('fetch account balance from with no entries', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        [systemAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
      ]);

      const balance = await storage.fetchAccountBalance(
        ledgerId,
        systemAccount('INCOME_PAID_PROJECTS'),
      );
      expect(balance).toBeNull();
    });

    test('fetch account balance', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        [systemAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
        [systemAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
      ]);

      await storage.saveEntityAccountTypes(ledgerId, [
        ['ENTITY_RECEIVABLES', 'DEBIT'],
      ]);

      const transaction = new Transaction(
        [
          new DoubleEntry(
            debit(entityAccount('RECEIVABLES', 1), new Money(100, 'USD')),
            credit(
              systemAccount('INCOME_PAID_PROJECTS'),
              new Money(100, 'USD'),
            ),
            'User owes money for goods',
          ),
          new DoubleEntry(
            debit(entityAccount('RECEIVABLES', 1), new Money(3, 'USD')),
            credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
            'User owes payment processing fee',
          ),
        ],
        'test transaction',
      );

      await storage.insertTransaction(ledgerId, transaction);

      const receivables = await storage.fetchAccountBalance(
        ledgerId,
        entityAccount('RECEIVABLES', 1),
      );
      expect(receivables).toEqual(new Money(103, 'USD'));
    });
  });
});
