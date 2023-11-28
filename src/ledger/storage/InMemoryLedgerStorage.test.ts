import { DoubleEntry } from '../records/DoubleEntry.js';
import { credit, debit } from '../records/Entry.js';
import { Transaction } from '../records/Transaction.js';
import { InMemoryLedgerStorage } from './InMemoryStorage.js';
import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { Money } from '@/money/Money.js';
import { UserLedgerAccount } from '#/customLedger/accounts/UserLedgerAccount.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

const UUID_REGEX = /^[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}$/u;

const ledgerId = uuid();

describe('InMemoryLedgerStorage', () => {
  describe('save accounts', () => {
    test('save system accounts', async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts(ledgerId, [
        [new SystemLedgerAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
        [new SystemLedgerAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
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
      const originalAccount = new SystemLedgerAccount('INCOME_PAID_PROJECTS');
      await storage.saveAccounts(ledgerId, [[originalAccount, 'CREDIT']]);

      await expect(async () => {
        await storage.saveAccounts(ledgerId, [
          [new SystemLedgerAccount('INCOME_PAID_PROJECTS'), 'DEBIT'],
        ]);
      }).rejects.toThrow(
        `Account SYSTEM_INCOME_PAID_PROJECTS cannot be inserted`,
      );
    });

    test('cannot override existing user account', async () => {
      const entityId = 1;
      const storage = new InMemoryLedgerStorage();
      const originalAccount = new UserLedgerAccount('RECEIVABLES', entityId);
      await storage.saveAccounts(ledgerId, [[originalAccount, 'DEBIT']]);

      await storage.saveAccounts(ledgerId, [
        [new UserLedgerAccount('RECEIVABLES', 1), 'CREDIT'],
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
      [new SystemLedgerAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [new SystemLedgerAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['ENTITY_RECEIVABLES', 'DEBIT'],
    ]);

    const transaction = new Transaction(
      [
        new DoubleEntry(
          debit(
            new EntityLedgerAccount('RECEIVABLES', 1),
            new Money(100, 'USD'),
          ),
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
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
        type: 'DEBIT',
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        amount: new Money(100, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
        type: 'CREDIT',
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
        type: 'DEBIT',
      }),
      expect.objectContaining({
        accountId: expect.stringMatching(UUID_REGEX),
        amount: new Money(3, 'USD'),
        id: expect.any(String),
        transactionId: expect.stringMatching(UUID_REGEX),
        type: 'CREDIT',
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

  test('fetch account balance', async () => {
    const storage = new InMemoryLedgerStorage();
    await storage.saveAccounts(ledgerId, [
      [new SystemLedgerAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [new SystemLedgerAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['ENTITY_RECEIVABLES', 'DEBIT'],
    ]);

    const transaction = new Transaction(
      [
        new DoubleEntry(
          debit(
            new EntityLedgerAccount('RECEIVABLES', 1),
            new Money(100, 'USD'),
          ),
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
      ],
      'test transaction',
    );

    await storage.insertTransaction(ledgerId, transaction);

    const receivables = await storage.fetchAccountBalance(
      ledgerId,
      new EntityLedgerAccount('RECEIVABLES', 1),
    );
    expect(receivables).toEqual(new Money(103, 'USD'));
  });
});
