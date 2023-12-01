import { LedgerError } from '@/errors.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { EntriesWithSameAction } from '@/ledger/transaction/EntriesWithSameAction.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Money, usd } from '@/money/Money.js';
import { CustomLedger } from '#/customLedger/CustomerLedger.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();
const ledger = new CustomLedger(ledgerId);
const { systemAccount, userAccount } = ledger.accountFactories();

describe('UniformEntrySet', () => {
  test('cannot create UniformEntrySet with different operation types', () => {
    expect(() => {
      EntriesWithSameAction.build([
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        debit(userAccount('RECEIVABLES', 1), usd(100)),
        credit(systemAccount('EXPENSES_PAYOUTS'), usd(100)),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same type'));
  });

  test('cannot create UniformEntrySet with different currency codes', () => {
    expect(() => {
      EntriesWithSameAction.build([
        credit(userAccount('RECEIVABLES', 1), new Money(100, 'CAD')),
        credit(systemAccount('EXPENSES_PAYOUTS'), new Money(100, 'USD')),
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
    const entry = debit(userAccount('RECEIVABLES', 1), usd(100));
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });

  test('create UniformEntrySet from one credit operation', () => {
    const entry = credit(userAccount('RECEIVABLES', 1), usd(100));
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });
});
