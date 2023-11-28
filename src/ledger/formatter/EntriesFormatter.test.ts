import { account } from '@/index.js';
import { EntriesFormatter } from '@/ledger/formatter/EntriesFormatter.js';
import { credit, debit } from '@/ledger/records/Entry.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

describe('EntriesFormatter', () => {
  const formatter = new EntriesFormatter();

  test('format entries in compact human readable form', () => {
    const entries = [
      debit(account('RECEIVABLES', 1), new Money(100, 'USD')),
      credit(account('INCOME_PAID_PROJECTS'), new Money(100, 'USD')),
      debit(account('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(account('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
    ];

    const formatterValue = formatter.format(entries);
    expect(formatterValue).toEqual(
      `DEBIT  $100 USER_RECEIVABLES:1
CREDIT $100 SYSTEM_INCOME_PAID_PROJECTS
DEBIT  $3 USER_RECEIVABLES:1
CREDIT $3 SYSTEM_INCOME_PAYMENT_FEE`,
    );
  });
});
