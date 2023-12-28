import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { randomString } from '#/helpers/chance.js';
import { describe, expect, test } from 'vitest';

const ledgerSlug = randomString();

describe('SystemLedgerAccount', () => {
  test('create system account', () => {
    const account = new SystemAccountRef(ledgerSlug, 'SYSTEM_CURRENT_ASSETS');
    expect(account.accountSlug).toEqual('SYSTEM_CURRENT_ASSETS');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new SystemAccountRef(ledgerSlug, '')).toThrow(
      'Account name cannot be empty',
    );
  });

  test.each([
    ['lowerCase'],
    ['specialChars!'],
    ['special_Chars'],
    ['QWE_RTY_'],
    ['{}'],
  ])('cannot create entity account with invalid name %s', (name) => {
    expect(() => new SystemAccountRef(ledgerSlug, name)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });
});
