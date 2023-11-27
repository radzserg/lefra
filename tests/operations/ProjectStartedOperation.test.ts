import { CustomLedger } from '../customLedger/CustomLedger.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/InMemoryStorage.js';
import { Money } from '@/money/Money.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

describe('ProjectStartedOperation', () => {
  const ledgerId = uuid();
  const storage = new InMemoryLedgerStorage();
  const ledger = new CustomLedger(ledgerId, storage);

  test('records ProjectStartedOperation', async () => {
    const transaction = await ledger.record({
      amountLockedForCustomer: new Money(50, 'USD'),
      clientUserId: 1,
      customerUserId: 2,
      paymentProcessingFee: new Money(5, 'USD'),
      platformFee: new Money(10, 'USD'),
      targetNetAmount: new Money(100, 'USD'),
      type: 'PROJECT_STARTED',
    });

    // await ledger.record(operation);
    expect(true).toBe(true);
    expect(transaction).not.toBeNull();
  });
});
