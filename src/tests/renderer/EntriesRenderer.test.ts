import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { EntriesRenderer } from '@/ledger/renderer/EntriesRenderer.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { randomString } from '#/helpers/chance.js';
import { usd } from '#/helpers/units.js';
import { describe, expect, test } from 'vitest';

const ledgerSlug = randomString();
const userReceivables = new EntityAccountRef(ledgerSlug, 'USER_RECEIVABLES', 1);
const incomePaidProjects = new SystemAccountRef(
  ledgerSlug,
  'SYSTEM_INCOME_PAID_PROJECTS',
);
const incomePaymentFee = new SystemAccountRef(
  ledgerSlug,
  'SYSTEM_INCOME_PAYMENT_FEE',
);

describe('EntriesRenderer', () => {
  const formatter = new EntriesRenderer();

  test('format entries in compact human readable form', () => {
    const entries = [
      debit(userReceivables, usd(100.55)),
      credit(incomePaidProjects, usd(100.55)),
      debit(userReceivables, usd(3)),
      credit(incomePaymentFee, usd(3)),
    ];

    const formatterValue = formatter.render(entries);
    expect(formatterValue).toEqual(
      `DEBIT  USD:100.55 USER_RECEIVABLES:1
CREDIT USD:100.55 SYSTEM_INCOME_PAID_PROJECTS
DEBIT  USD:3.00 USER_RECEIVABLES:1
CREDIT USD:3.00 SYSTEM_INCOME_PAYMENT_FEE`,
    );
  });
});
