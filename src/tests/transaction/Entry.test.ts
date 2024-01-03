import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { randomString } from '#/helpers/chance.js';
import { usd } from '#/helpers/units.js';
import { describe, expect, test } from 'vitest';

describe('Entry', () => {
  const ledgerSlug = randomString();
  const account = new EntityAccountRef(ledgerSlug, 'RECEIVABLES', 1);

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
    expect(() => debit(account, usd(0)).validate()).toThrow(
      'Cannot create entry with zero amount',
    );
  });

  test('can have entry with zero amount if it was marked as nullable', () => {
    const entry = debit(account, usd(0)).nullable();
    expect(() => entry.validate()).not.toThrow();
  });
});
