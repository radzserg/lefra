import { credit, debit, UniformEntrySet } from './Entry.js';
import { LedgerError } from '@/errors.js';
import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { Money } from '@/money/Money.js';
import { v4 as uuid } from 'uuid';
import { describe, expect, test } from 'vitest';

describe('UniformEntrySet', () => {
  test('cannot create UniformEntrySet with different operation types', () => {
    expect(() => {
      UniformEntrySet.build([
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(100, 'USD')),
        credit(new SystemLedgerAccount('EXPENSES'), new Money(100, 'USD')),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same type'));
  });

  test('cannot create UniformEntrySet with different currency codes', () => {
    expect(() => {
      UniformEntrySet.build([
        credit(
          new EntityLedgerAccount('RECEIVABLES', 1),
          new Money(100, 'CAD'),
        ),
        credit(new SystemLedgerAccount('EXPENSES'), new Money(100, 'USD')),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same currency'));
  });

  test('cannot create UniformEntrySet with empty operations', () => {
    expect(() => {
      UniformEntrySet.build(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        [],
      );
    }).toThrow(new LedgerError('Operations array must not be empty'));
  });

  test('create UniformEntrySet from one debit operation', () => {
    const entry = debit(
      new EntityLedgerAccount('RECEIVABLES', 1),
      new Money(100, 'USD'),
    );
    const entries = UniformEntrySet.build(entry);
    expect(entries.entries()).toEqual([entry]);
    expect(entry.id).toBeTypeOf('string');
  });

  test('create UniformEntrySet from one credit operation', () => {
    const entry = credit(
      new EntityLedgerAccount('RECEIVABLES', 1),
      new Money(100, 'USD'),
    );
    const entries = UniformEntrySet.build(entry);
    expect(entries.entries()).toEqual([entry]);
    expect(entry.id).toBeTypeOf('string');
  });

  test('cannot have zero sum of operations', () => {
    expect(() => {
      UniformEntrySet.build([
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(0, 'USD')),
      ]);
    }).toThrow(new LedgerError('Operations must not sum to zero'));

    expect(() => {
      UniformEntrySet.build([
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(0, 'USD')),
        debit(new EntityLedgerAccount('RECEIVABLES', 1), new Money(0, 'USD')),
      ]);
    }).toThrow(new LedgerError('Operations must not sum to zero'));
  });

  test('cannot override operation transaction id', () => {
    const operation = debit(
      new EntityLedgerAccount('RECEIVABLES', 1),
      new Money(0, 'USD'),
    );
    const originalTransactionId = uuid();
    operation.transactionId = originalTransactionId;
    expect(() => {
      operation.transactionId = uuid();
    }).toThrow(
      new LedgerError('Operation is already attached to a transaction'),
    );
    expect(operation.transactionId).toEqual(originalTransactionId);
  });
});
