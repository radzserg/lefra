import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();

describe('SystemLedgerAccount', () => {
  test('create system account', () => {
    const account = new SystemAccountRef(ledgerId, 'SYSTEM_CURRENT_ASSETS');
    expect(account.slug).toEqual('SYSTEM_CURRENT_ASSETS');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new SystemAccountRef(ledgerId, '')).toThrow(
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
    expect(() => new SystemAccountRef(ledgerId, name)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });
});
