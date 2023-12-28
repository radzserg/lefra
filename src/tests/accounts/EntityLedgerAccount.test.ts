import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { randomInt, randomString } from '#/helpers/chance.js';
import { describe, expect, test } from 'vitest';

const ledgerSlug = randomString();

describe('EntityLedgerAccount', () => {
  test('create entity entity account', () => {
    const account = new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1);

    expect(account.externalId).toEqual(1);
    expect(account.name).toEqual('USER_RECEIVABLES');
    expect(account.accountSlug).toEqual('USER_RECEIVABLES:1');
  });

  test('create entity user account', () => {
    const userAccountId = randomInt();
    const account = new EntityAccountRef(
      ledgerSlug,
      'USER_RECEIVABLES_LOCKED',
      userAccountId,
    );

    expect(account.externalId).toEqual(userAccountId);
    expect(account.accountSlug).toEqual(
      `USER_RECEIVABLES_LOCKED:${userAccountId}`,
    );
    expect(account.name).toEqual('USER_RECEIVABLES_LOCKED');
  });

  test('cannot create entity account with empty name', () => {
    expect(() => new EntityAccountRef(ledgerSlug, '', 1)).toThrow(
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
    expect(() => new EntityAccountRef(ledgerSlug, name, 1)).toThrow(
      'Account name can only contain uppercase letters without special characters',
    );
  });
});
