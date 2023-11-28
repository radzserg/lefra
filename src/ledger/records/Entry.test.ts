import { debit } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { Money } from '@/money/Money.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

describe('Entry', () => {
  test('cannot override operation transaction id', () => {
    const entry = debit(
      new EntityLedgerAccount('RECEIVABLES', 1),
      new Money(0, 'USD'),
    );
    const originalTransactionId = uuid();
    entry.transactionId = originalTransactionId;
    expect(() => {
      entry.transactionId = uuid();
    }).toThrow(
      new LedgerError('Operation is already attached to a transaction'),
    );
    expect(entry.transactionId).toEqual(originalTransactionId);
  });
});
