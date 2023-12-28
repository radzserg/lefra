import { LedgerError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { EntriesWithSameAction } from '@/ledger/transaction/EntriesWithSameAction.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Unit } from '@/ledger/units/Unit.js';
import { randomString } from '#/helpers/chance.js';
import { cad, usd } from '#/helpers/units.js';
import { describe, expect, test } from 'vitest';

const ledgerSlug = randomString();

describe('EntriesWithSameAction', () => {
  const userReceivables = new EntityAccountRef(
    ledgerSlug,
    'USER_RECEIVABLES',
    1,
  );
  const expensesPayouts = new SystemAccountRef(
    ledgerSlug,
    'SYSTEM_EXPENSES_PAYOUTS',
  );
  test('cannot create EntriesWithSameAction with different operation types', () => {
    expect(() => {
      EntriesWithSameAction.build([
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        debit(userReceivables, usd(100)),
        credit(expensesPayouts, usd(100)),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same type'));
  });

  test('cannot create EntriesWithSameAction with operations with different units', () => {
    expect(() => {
      EntriesWithSameAction.build([
        debit(userReceivables, usd(100)),
        debit(expensesPayouts, cad(100)),
      ]);
    }).toThrow(new LedgerError('All operations must be of the same currency'));
  });

  test('cannot create EntriesWithSameAction with different currency codes', () => {
    const cadEntry = credit(userReceivables, new Unit(100, 'CAD', 2));
    const usdEntry = credit(expensesPayouts, new Unit(100, 'USD', 2));

    expect(() => {
      EntriesWithSameAction.build([cadEntry, usdEntry]);
    }).toThrow(new LedgerError('All operations must be of the same currency'));
  });

  test('cannot create EntriesWithSameAction with empty operations', () => {
    expect(() => {
      EntriesWithSameAction.build(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        [],
      );
    }).toThrow(new LedgerError('Operations array must not be empty'));
  });

  test('create EntriesWithSameAction from one debit operation', () => {
    const entry = debit(userReceivables, usd(100));
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });

  test('create EntriesWithSameAction from one credit operation', () => {
    const entry = credit(userReceivables, usd(100));
    const entries = EntriesWithSameAction.build(entry);
    expect(entries.entries()).toEqual([entry]);
  });
});
