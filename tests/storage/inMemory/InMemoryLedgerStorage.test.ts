import { LedgerUnexpectedError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/inMemory/InMemoryLedgerStorage.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

const UUID_REGEX = /^[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}$/u;

const ledgerSlug = 'TEST_LEDGER';

const createStorage = async (
  storageType: 'IN_MEMORY',
): Promise<LedgerStorage> => {
  if (storageType === 'IN_MEMORY') {
    return new InMemoryLedgerStorage();
  }

  throw new LedgerUnexpectedError('Unknown storage type');
};

const saveLedger = async (storage: LedgerStorage) => {
  return await storage.insertLedger({
    currencyCode: 'USD',
    description: null,
    name: 'Test ledger',
    slug: ledgerSlug,
  });
};

const saveTestLedgerAccounts = async (storage: LedgerStorage) => {
  const { id: ledgerId } = await saveLedger(storage);
  const incomeAccountType = await storage.insertAccountType({
    description: 'Income accounts',
    isEntityLedgerAccount: false,
    ledgerId,
    name: 'SYSTEM_INCOME',
    normalBalance: 'CREDIT',
    parentLedgerAccountTypeId: null,
    slug: 'SYSTEM_INCOME',
  });
  const receivablesAccountType = await storage.insertAccountType({
    description: 'Receivables',
    isEntityLedgerAccount: true,
    ledgerId,
    name: 'USER_RECEIVABLES',
    normalBalance: 'DEBIT',
    parentLedgerAccountTypeId: null,
    slug: 'USER_RECEIVABLES',
  });

  const incomePaidProjectAccount = await storage.upsertAccount({
    description: 'Income from paid projects',
    isSystemAccount: true,
    ledgerAccountTypeId: incomeAccountType.id,
    ledgerId,
    slug: 'SYSTEM_INCOME_PAID_PROJECTS',
  });
  const incomePaymentFeeAccount = await storage.upsertAccount({
    description: 'Income from payment fees',
    isSystemAccount: true,
    ledgerAccountTypeId: incomeAccountType.id,
    ledgerId,
    slug: 'SYSTEM_INCOME_PAYMENT_FEE',
  });

  return {
    incomePaidProjectAccount,
    incomePaymentFeeAccount,
    ledgerId,
    receivablesAccountType,
  };
};

describe('InMemoryLedgerStorage', () => {
  const storageType = 'IN_MEMORY';
  describe('ledger account types', () => {
    test('insert new account type', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);

      await storage.insertAccountType({
        description: 'User payables',
        isEntityLedgerAccount: true,
        ledgerId,
        name: 'USER_PAYABLES_LOCKED',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'USER_PAYABLES_LOCKED',
      });

      const payables = await storage.findAccountTypeBySlug(
        'USER_PAYABLES_LOCKED',
      );
      expect(payables).toEqual({
        description: 'User payables',
        id: expect.stringMatching(UUID_REGEX),
        isEntityLedgerAccount: true,
        ledgerId,
        name: 'USER_PAYABLES_LOCKED',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'USER_PAYABLES_LOCKED',
      });

      await storage.insertAccountType({
        description: 'Assets',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'ASSETS',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'ASSETS',
      });

      const assets = await storage.findAccountTypeBySlug('ASSETS');
      expect(assets).not.toBeNull();
      expect(assets).toEqual({
        description: 'Assets',
        id: expect.stringMatching(UUID_REGEX),
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'ASSETS',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'ASSETS',
      });
      if (!assets) {
        throw new Error('Assets should not be null');
      }

      await storage.insertAccountType({
        description: 'Receivables',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'RECEIVABLES',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: assets.id,
        slug: 'RECEIVABLES',
      });

      const receivables = await storage.findAccountTypeBySlug('RECEIVABLES');
      expect(receivables).toEqual({
        description: 'Receivables',
        id: expect.stringMatching(UUID_REGEX),
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'RECEIVABLES',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: assets.id,
        slug: 'RECEIVABLES',
      });
    });

    test('cannot insert account types if parent account does not exist', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);

      await expect(
        storage.insertAccountType({
          description: 'Receivables',
          isEntityLedgerAccount: false,
          ledgerId,
          name: 'RECEIVABLES',
          normalBalance: 'CREDIT',
          parentLedgerAccountTypeId: '123',
          slug: 'RECEIVABLES',
        }),
      ).rejects.toThrow(`Account type ID: 123 not found`);
    });

    test('cannot insert account types if types are different', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);

      await storage.insertAccountType({
        description: 'Assets',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'ASSETS',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'ASSETS',
      });

      const assets = await storage.findAccountTypeBySlug('ASSETS');
      expect(assets).not.toBeNull();
      expect(assets).toEqual({
        description: 'Assets',
        id: expect.stringMatching(UUID_REGEX),
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'ASSETS',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'ASSETS',
      });
      if (!assets) {
        throw new Error('Assets should not be null');
      }

      await expect(
        storage.insertAccountType({
          description: 'Receivables',
          isEntityLedgerAccount: false,
          ledgerId,
          name: 'RECEIVABLES',
          normalBalance: 'DEBIT',
          parentLedgerAccountTypeId: assets.id,
          slug: 'RECEIVABLES',
        }),
      ).rejects.toThrow(
        'Parent account type must have the same normal balance',
      );
    });

    test('cannot override account type', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);

      await storage.insertAccountType({
        description: 'Assets',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'ASSETS',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'ASSETS',
      });

      await expect(
        storage.insertAccountType({
          description: 'Assets',
          isEntityLedgerAccount: false,
          ledgerId,
          name: 'ASSETS',
          normalBalance: 'CREDIT',
          parentLedgerAccountTypeId: null,
          slug: 'ASSETS',
        }),
      ).rejects.toThrow('Account type ASSETS already exists');
    });
  });

  describe('save accounts', () => {
    test('insert new system account', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      const ledgerAccountType = await storage.insertAccountType({
        description: 'Income accounts',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'SYSTEM_INCOME',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'SYSTEM_INCOME',
      });

      await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: true,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'SYSTEM_INCOME_PAID_PROJECTS',
      });

      const incomeProjectAccount = await storage.findAccount(
        new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
      );

      expect(incomeProjectAccount).toEqual({
        description: 'Income from paid projects',
        id: expect.stringMatching(UUID_REGEX),
        isSystemAccount: true,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'SYSTEM_INCOME_PAID_PROJECTS',
      });
    });

    test('insert new entity account', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      const ledgerAccountType = await storage.insertAccountType({
        description: 'User receivables',
        isEntityLedgerAccount: true,
        ledgerId,
        name: 'RECEIVABLES',
        normalBalance: 'DEBIT',
        parentLedgerAccountTypeId: null,
        slug: 'RECEIVABLES',
      });

      await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: false,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });

      const receivables = await storage.findAccount(
        new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
      );

      expect(receivables).toEqual({
        description: 'Income from paid projects',
        id: expect.stringMatching(UUID_REGEX),
        isSystemAccount: false,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });
    });

    test('cannot insert entity account if account type does not exist', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      await expect(
        storage.upsertAccount({
          description: 'Income from paid projects',
          isSystemAccount: false,
          ledgerAccountTypeId: 123_213,
          ledgerId,
          slug: 'USER_RECEIVABLES:1',
        }),
      ).rejects.toThrow(`Account type ID: 123213 not found`);
    });

    test('cannot insert entity account if account type is not entity account type', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      const ledgerAccountType = await storage.insertAccountType({
        description: 'User receivables',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'RECEIVABLES',
        normalBalance: 'DEBIT',
        parentLedgerAccountTypeId: null,
        slug: 'RECEIVABLES',
      });

      await expect(
        storage.upsertAccount({
          description: 'Income from paid projects',
          isSystemAccount: false,
          ledgerAccountTypeId: ledgerAccountType.id,
          ledgerId,
          slug: 'USER_RECEIVABLES:1',
        }),
      ).rejects.toThrow(
        `The account type with ID ${ledgerAccountType.id} is not a valid entity ledger account type, so it cannot be used to insert an entity ledger account.`,
      );
    });

    test('upsert system account', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      const ledgerAccountType = await storage.insertAccountType({
        description: 'Income accounts',
        isEntityLedgerAccount: false,
        ledgerId,
        name: 'INCOME',
        normalBalance: 'CREDIT',
        parentLedgerAccountTypeId: null,
        slug: 'INCOME',
      });

      await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: true,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'SYSTEM_INCOME_PAID_PROJECTS',
      });

      const incomeProjectAccount = await storage.findAccount(
        new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
      );

      expect(incomeProjectAccount).toEqual({
        description: 'Income from paid projects',
        id: expect.stringMatching(UUID_REGEX),
        isSystemAccount: true,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'SYSTEM_INCOME_PAID_PROJECTS',
      });

      const upsertedAccount = await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: true,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'SYSTEM_INCOME_PAID_PROJECTS',
      });
      expect(upsertedAccount).toEqual(incomeProjectAccount);
    });

    test('upsert entity account', async () => {
      const storage = await createStorage(storageType);
      const { id: ledgerId } = await saveLedger(storage);
      const ledgerAccountType = await storage.insertAccountType({
        description: 'User receivables',
        isEntityLedgerAccount: true,
        ledgerId,
        name: 'RECEIVABLES',
        normalBalance: 'DEBIT',
        parentLedgerAccountTypeId: null,
        slug: 'RECEIVABLES',
      });

      await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: false,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });

      const receivables = await storage.findAccount(
        new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
      );

      expect(receivables).toEqual({
        description: 'Income from paid projects',
        id: expect.stringMatching(UUID_REGEX),
        isSystemAccount: false,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });

      const upsertedAccount = await storage.upsertAccount({
        description: 'Income from paid projects',
        isSystemAccount: false,
        ledgerAccountTypeId: ledgerAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });
      expect(upsertedAccount).toEqual(receivables);
    });
  });

  describe('save transactions', () => {
    test('save transactions', async () => {
      const storage = await createStorage(storageType);
      const {
        incomePaidProjectAccount,
        incomePaymentFeeAccount,
        ledgerId,
        receivablesAccountType,
      } = await saveTestLedgerAccounts(storage);

      const transaction = new Transaction(
        new TransactionDoubleEntries().push(
          doubleEntry(
            debit(
              new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
              new Money(100, 'USD'),
            ),
            credit(
              new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
              new Money(100, 'USD'),
            ),
            'User owes money for goods',
          ),
          doubleEntry(
            debit(
              new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
              new Money(3, 'USD'),
            ),
            credit(
              new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAYMENT_FEE'),
              new Money(3, 'USD'),
            ),
            'User owes payment processing fee',
          ),
        ),
        'test transaction',
      );

      const persistedTransaction = await storage.insertTransaction(transaction);

      const userReceivablesAccount = await storage.findAccount(
        new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
      );

      // expect that we dynamically created the USER_RECEIVABLES account
      expect(userReceivablesAccount).toEqual({
        description: 'Receivables. Account created for entity ID:1.',
        id: expect.stringMatching(UUID_REGEX),
        isSystemAccount: false,
        ledgerAccountTypeId: receivablesAccountType.id,
        ledgerId,
        slug: 'USER_RECEIVABLES:1',
      });
      if (!userReceivablesAccount) {
        throw new LedgerUnexpectedError(
          'userReceivablesAccount should not be null',
        );
      }

      const savedTransaction = await storage.getTransactionById(
        persistedTransaction.id,
      );
      expect(savedTransaction).toEqual({
        description: 'test transaction',
        id: persistedTransaction.id,
        ledgerId,
        postedAt: persistedTransaction.postedAt,
      });

      const entries = await storage.getTransactionEntries(
        persistedTransaction.id,
      );

      expect(entries).toEqual([
        expect.objectContaining({
          action: 'DEBIT',
          amount: new Money(100, 'USD'),
          id: expect.stringMatching(UUID_REGEX),
          ledgerAccountId: expect.stringMatching(UUID_REGEX),
          ledgerTransactionId: persistedTransaction.id,
        }),
        expect.objectContaining({
          action: 'CREDIT',
          amount: new Money(100, 'USD'),
          id: expect.stringMatching(UUID_REGEX),
          ledgerAccountId: incomePaidProjectAccount.id,
          ledgerTransactionId: persistedTransaction.id,
        }),
        expect.objectContaining({
          action: 'DEBIT',
          amount: new Money(3, 'USD'),
          id: expect.stringMatching(UUID_REGEX),
          ledgerAccountId: userReceivablesAccount.id,
          ledgerTransactionId: persistedTransaction.id,
        }),
        expect.objectContaining({
          action: 'CREDIT',
          amount: new Money(3, 'USD'),
          id: expect.stringMatching(UUID_REGEX),
          ledgerAccountId: incomePaymentFeeAccount.id,
          ledgerTransactionId: persistedTransaction.id,
        }),
      ]);
    });
  });

  describe('fetch account balance', () => {
    test('throw an error if ledger account does not exist', async () => {
      const storage = await createStorage(storageType);
      await saveLedger(storage);
      await expect(async () => {
        await storage.fetchAccountBalance(
          new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
        );
      }).rejects.toThrow('Account SYSTEM_INCOME_PAID_PROJECTS not found');
    });

    test('fetch account balance from with no entries', async () => {
      const storage = await createStorage(storageType);
      await saveTestLedgerAccounts(storage);

      const balance = await storage.fetchAccountBalance(
        new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
      );
      expect(balance).toBeNull();
    });

    test('fetch account balance', async () => {
      const storage = await createStorage(storageType);
      await saveTestLedgerAccounts(storage);

      const transaction = new Transaction(
        new TransactionDoubleEntries().push(
          doubleEntry(
            debit(
              new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
              new Money(100, 'USD'),
            ),
            credit(
              new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAID_PROJECTS'),
              new Money(100, 'USD'),
            ),
            'User owes money for goods',
          ),
          doubleEntry(
            debit(
              new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
              new Money(3, 'USD'),
            ),
            credit(
              new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAYMENT_FEE'),
              new Money(3, 'USD'),
            ),
            'User owes payment processing fee',
          ),
        ),
        'test transaction',
      );

      await storage.insertTransaction(transaction);

      const receivables = await storage.fetchAccountBalance(
        new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1),
      );
      expect(receivables).toEqual(new Money(103, 'USD'));

      const incomePaymentFee = await storage.fetchAccountBalance(
        new SystemAccountRef(ledgerSlug, 'SYSTEM_INCOME_PAYMENT_FEE'),
      );
      expect(incomePaymentFee).toEqual(new Money(3, 'USD'));
    });
  });
});
