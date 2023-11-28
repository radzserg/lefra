import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { describe, expect, test } from 'vitest';

describe('SystemLedgerAccount', () => {
  test('create system account', () => {
    const account = new SystemLedgerAccount('CURRENT_ASSETS');

    expect(account.uniqueNamedIdentifier).toEqual('SYSTEM_CURRENT_ASSETS');
    expect(account.toJSON()).toEqual({
      id: expect.any(String),
      name: 'SYSTEM_CURRENT_ASSETS',
    });
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new SystemLedgerAccount('')).toThrow(
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
    expect(() => new SystemLedgerAccount(name)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });

  test('cannot override prefix', () => {
    const account = new SystemLedgerAccount('CURRENT_ASSETS', 'CORE');
    expect(account.toJSON()).toEqual({
      id: expect.any(String),
      name: 'CORE_CURRENT_ASSETS',
    });
  });
});
