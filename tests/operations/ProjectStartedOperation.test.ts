import { account } from '@/index.js';
import { Ledger } from '@/ledger/Ledger.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/InMemoryStorage.js';
import { Money, usd } from '@/money/Money.js';
import { ProjectStartedOperation } from '#/customLedger/operations/ProjectStartedOperation.js';
import { assertTransaction } from '#/helpers/assertTransaction.js';
import { v4 as uuid } from 'uuid';
import { beforeAll, describe, expect, test } from 'vitest';

describe('ProjectStartedOperation', () => {
  const ledgerId = uuid();
  const storage = new InMemoryLedgerStorage();
  const ledger = new Ledger(ledgerId, storage);
  const clientUserId = 1;
  const customerUserId = 2;

  beforeAll(async () => {
    await storage.saveAccounts(ledgerId, [
      [account('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [account('INCOME_PAYMENT_FEE'), 'CREDIT'],
      [account('INCOME_CONTRACT_FEES'), 'CREDIT'],
      [account('EXPENSES_PAYOUTS'), 'DEBIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['USER_RECEIVABLES', 'DEBIT'],
      ['USER_PAYABLE_LOCKED', 'CREDIT'],
      ['USER_PAYABLE', 'CREDIT'],
    ]);
  });

  test('records ProjectStartedOperation', async () => {
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForCustomer: new Money(50, 'USD'),
        clientUserId,
        customerUserId,
        paymentProcessingFee: new Money(5, 'USD'),
        platformFee: new Money(10, 'USD'),
        targetNetAmount: new Money(100, 'USD'),
      }),
    );

    expect(true).toBe(true);
    expect(transaction).not.toBeNull();

    assertTransaction(transaction, {
      entries: [
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(100)],
        ['CREDIT', 'SYSTEM_INCOME_PAID_PROJECTS', usd(100)],
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(5)],
        ['CREDIT', 'SYSTEM_INCOME_PAYMENT_FEE', usd(5)],
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(10)],
        ['CREDIT', 'SYSTEM_INCOME_CONTRACT_FEES', usd(10)],
        ['DEBIT', 'SYSTEM_EXPENSES_PAYOUTS', usd(100)],
        ['CREDIT', `USER_PAYABLE_LOCKED:${customerUserId}`, usd(50)],
        ['CREDIT', `USER_PAYABLE:${customerUserId}`, usd(50)],
      ],
    });
  });
});
