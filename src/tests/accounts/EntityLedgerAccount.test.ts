import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();

describe('EntityLedgerAccount', () => {
  test('create entity entity account', () => {
    const account = new EntityAccountRef(ledgerId, 'USER_RECEIVABLES', 1);

    expect(account.externalId).toEqual(1);
    expect(account.name).toEqual('USER_RECEIVABLES');
    expect(account.accountSlug).toEqual('USER_RECEIVABLES:1');
  });

  test('create entity user account', () => {
    const userAccountId = 'a934cae1-f809-4aac-8b82-f639977d9512';
    const account = new EntityAccountRef(
      ledgerId,
      'USER_RECEIVABLES_LOCKED',
      userAccountId,
    );

    expect(account.externalId).toEqual('a934cae1-f809-4aac-8b82-f639977d9512');
    expect(account.accountSlug).toEqual(
      'USER_RECEIVABLES_LOCKED:a934cae1-f809-4aac-8b82-f639977d9512',
    );
    expect(account.name).toEqual('USER_RECEIVABLES_LOCKED');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new EntityAccountRef(ledgerId, '', 1)).toThrow(
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
    expect(() => new EntityAccountRef(ledgerId, name, 1)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });
});
