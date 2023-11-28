import { systemAccount } from '@/ledger/accounts/LedgerAccount.js';
import { describe, expect, test } from 'vitest';

describe('SystemLedgerAccount', () => {
  test('create system account', () => {
    const account = systemAccount('CURRENT_ASSETS');
    expect(account.name).toEqual('SYSTEM_CURRENT_ASSETS');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => systemAccount('')).toThrow('Account name cannot be empty');
  });

  test.each([
    ['lowerCase'],
    ['specialChars!'],
    ['special_Chars'],
    ['QWE_RTY_'],
    ['{}'],
  ])('cannot create entity account with invalid name %s', (name) => {
    expect(() => systemAccount(name)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });

  test('cannot override prefix', () => {
    const account = systemAccount('CURRENT_ASSETS', 'CORE');
    expect(account.name).toEqual('CORE_CURRENT_ASSETS');
  });
});
