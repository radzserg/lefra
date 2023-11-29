import {
  entityAccount,
  systemAccount,
} from '@/ledger/accounts/LedgerAccount.js';
import { EntriesFormatter } from '@/ledger/formatter/EntriesFormatter.js';
import { credit, debit } from '@/ledger/records/Entry.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

describe('EntriesFormatter', () => {
  const formatter = new EntriesFormatter();

  test('format entries in compact human readable form', () => {
    const entries = [
      debit(entityAccount('RECEIVABLES', 1), new Money(100.55, 'USD')),
      credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100.55, 'USD')),
      debit(entityAccount('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
    ];

    const formatterValue = formatter.format(entries);
    expect(formatterValue).toEqual(
      `DEBIT  $100.55 ENTITY_RECEIVABLES:1
CREDIT $100.55 SYSTEM_INCOME_PAID_PROJECTS
DEBIT  $3.00 ENTITY_RECEIVABLES:1
CREDIT $3.00 SYSTEM_INCOME_PAYMENT_FEE`,
    );
  });
});
