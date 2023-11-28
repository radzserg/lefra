import { account } from '@/index.js';
import { Ledger } from '@/ledger/Ledger.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/InMemoryStorage.js';
import { Money } from '@/money/Money.js';
import { ProjectStartedOperation } from '#/customLedger/operations/ProjectStartedOperation.js';
import { v4 as uuid } from 'uuid';
import { beforeAll, describe, expect, test } from 'vitest';

describe('ProjectStartedOperation', () => {
  const ledgerId = uuid();
  const storage = new InMemoryLedgerStorage();
  const ledger = new Ledger(ledgerId, storage);

  beforeAll(async () => {
    await storage.saveAccounts(ledgerId, [
      account('INCOME_PAID_PROJECTS'),
      account('INCOME_PAYMENT_FEE'),
      account('INCOME_CONTRACT_FEES'),
      account('EXPENSES_PAYOUTS'),
    ]);
  });

  test('records ProjectStartedOperation', async () => {
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForCustomer: new Money(50, 'USD'),
        clientUserId: 1,
        customerUserId: 2,
        paymentProcessingFee: new Money(5, 'USD'),
        platformFee: new Money(10, 'USD'),
        targetNetAmount: new Money(100, 'USD'),
        type: 'PROJECT_STARTED',
      }),
    );

    expect(true).toBe(true);
    expect(transaction).not.toBeNull();
  });
});
