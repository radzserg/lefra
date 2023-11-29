import { entityAccount } from '@/ledger/accounts/LedgerAccount.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { usd } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

describe('Entry', () => {
  const account = entityAccount('RECEIVABLES', 1);

  test('cannot create debit entry', () => {
    const amount = usd(100);
    const entry = debit(account, amount);
    expect(entry.action).toEqual('DEBIT');
    expect(entry.amount).toEqual(amount);
    expect(entry.account).toEqual(account);
  });

  test('cannot create credit entry', () => {
    const amount = usd(100);
    const entry = credit(account, amount);
    expect(entry.action).toEqual('CREDIT');
    expect(entry.amount).toEqual(amount);
    expect(entry.account).toEqual(account);
  });

  test('cannot have entry with zero amount', () => {
    expect(() => debit(account, usd(0))).toThrow(
      'Cannot create entry with zero amount',
    );
  });

  test('cannot have entry with negative amount', () => {
    const amount = usd(-100);
    expect(() => debit(account, amount)).toThrow(
      'Cannot create entry with negative amount',
    );
  });
});
