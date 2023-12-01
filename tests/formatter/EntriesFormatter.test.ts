import { EntriesFormatter } from '@/ledger/formatter/EntriesFormatter.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import { CustomLedger } from '#/customLedger/CustomerLedger.js';
import { describe, expect, test } from 'vitest';

describe('EntriesFormatter', () => {
  const formatter = new EntriesFormatter();

  test('format entries in compact human readable form', () => {
    const ledgerId = new UuidDatabaseIdGenerator().generateId();
    const ledger = new CustomLedger(ledgerId);
    const { systemAccount, userAccount } = ledger.accountFactories();

    const entries = [
      debit(userAccount('RECEIVABLES', 1), new Money(100.55, 'USD')),
      credit(systemAccount('INCOME_PAID_PROJECTS'), new Money(100.55, 'USD')),
      debit(userAccount('RECEIVABLES', 1), new Money(3, 'USD')),
      credit(systemAccount('INCOME_PAYMENT_FEE'), new Money(3, 'USD')),
    ];

    const formatterValue = formatter.format(entries);
    expect(formatterValue).toEqual(
      `DEBIT  $100.55 USER_RECEIVABLES:1
CREDIT $100.55 SYSTEM_INCOME_PAID_PROJECTS
DEBIT  $3.00 USER_RECEIVABLES:1
CREDIT $3.00 SYSTEM_INCOME_PAYMENT_FEE`,
    );
  });
});
