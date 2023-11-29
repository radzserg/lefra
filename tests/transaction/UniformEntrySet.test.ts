import { LedgerError } from '@/errors.js';
import {
  entityAccount,
  systemAccount,
} from '@/ledger/accounts/LedgerAccount.js';
import { EntriesWithSameAction } from '@/ledger/transaction/EntriesWithSameAction.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

describe('UniformEntrySet', () => {
  test('cannot create UniformEntrySet with different operation types', () => {
    expect(() => {
      EntriesWithSameAction.build([
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        debit(entityAccount('RECEIVABLES', 1), new Money(100, 'USD')),
        credit(systemAccount('EXPENSES'), new Money(100, 'USD')),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same type'));
  });

  test('cannot create UniformEntrySet with different currency codes', () => {
    expect(() => {
      EntriesWithSameAction.build([
        credit(entityAccount('RECEIVABLES', 1), new Money(100, 'CAD')),
        credit(systemAccount('EXPENSES'), new Money(100, 'USD')),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same currency'));
  });

  test('cannot create UniformEntrySet with empty operations', () => {
    expect(() => {
      EntriesWithSameAction.build(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        [],
      );
    }).toThrow(new LedgerError('Operations array must not be empty'));
  });

  test('create UniformEntrySet from one debit operation', () => {
    const entry = debit(entityAccount('RECEIVABLES', 1), new Money(100, 'USD'));
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });

  test('create UniformEntrySet from one credit operation', () => {
    const entry = credit(
      entityAccount('RECEIVABLES', 1),
      new Money(100, 'USD'),
    );
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });
});
