import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { EntriesFormatter } from '@/ledger/formatter/EntriesFormatter.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Money } from '@/money/Money.js';
import { describe, expect, test } from 'vitest';

const ledgerId = new UuidDatabaseIdGenerator().generateId();
const userReceivables = new EntityAccountRef(
  ledgerId,
  'RECEIVABLES',
  1,
  'USER',
);
const incomePaidProjects = new SystemAccountRef(
  ledgerId,
  'INCOME_PAID_PROJECTS',
);
const incomePaymentFee = new SystemAccountRef(ledgerId, 'INCOME_PAYMENT_FEE');

describe('EntriesFormatter', () => {
  const formatter = new EntriesFormatter();

  test('format entries in compact human readable form', () => {
    const entries = [
      debit(userReceivables, new Money(100.55, 'USD')),
      credit(incomePaidProjects, new Money(100.55, 'USD')),
      debit(userReceivables, new Money(3, 'USD')),
      credit(incomePaymentFee, new Money(3, 'USD')),
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