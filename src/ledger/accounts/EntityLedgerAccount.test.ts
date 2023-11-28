import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { describe, expect, test } from 'vitest';

describe('EntityLedgerAccount', () => {
  test('create entity entity account', () => {
    const account = new EntityLedgerAccount('RECEIVABLES', 1);

    expect(account.uniqueNamedIdentifier).toEqual('ENTITY_RECEIVABLES:1');
    expect(account.entityId).toEqual(1);
    expect(account.name).toEqual('ENTITY_RECEIVABLES');
  });

  test('create entity user account', () => {
    const userAccountId = 'a934cae1-f809-4aac-8b82-f639977d9512';
    const account = new EntityLedgerAccount(
      'RECEIVABLES_LOCKED',
      userAccountId,
      'USER',
    );

    expect(account.uniqueNamedIdentifier).toEqual(
      'USER_RECEIVABLES_LOCKED:a934cae1-f809-4aac-8b82-f639977d9512',
    );
    expect(account.entityId).toEqual('a934cae1-f809-4aac-8b82-f639977d9512');
    expect(account.name).toEqual('USER_RECEIVABLES_LOCKED');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new EntityLedgerAccount('', 1)).toThrow(
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
    expect(() => new EntityLedgerAccount(name, 1)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });

  test.each([
    ['lowerCase'],
    ['specialChars!'],
    ['special_Chars'],
    ['QWE_RTY_'],
    ['{}'],
  ])('cannot create entity account with invalid prefix %s', (prefix) => {
    expect(() => new EntityLedgerAccount('LOCKED', 1, prefix)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });

  test('cannot create entity account with reserved prefix SYSTEM', () => {
    expect(() => new EntityLedgerAccount('LOCKED', 1, 'SYSTEM')).toThrow(
      'Prefix SYSTEM is reserved',
    );
  });
});
