import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { TransactionFlowRenderer } from '@/ledger/renderer/TransactionFlowRenderer.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { usd } from '@/money/Money.js';
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
  const formatter = new TransactionFlowRenderer();

  test('render detailed transaction information', () => {
    const transaction = new Transaction(
      new TransactionDoubleEntries().push(
        doubleEntry(
          debit(userReceivables, usd(100)),
          credit(incomePaidProjects, usd(100)),
          'User owes money for goods',
        ),
        doubleEntry(
          debit(userReceivables, usd(3)),
          credit(incomePaymentFee, usd(3)),
          'User owes payment processing fee',
        ),
      ),
    );

    const formatterValue = formatter.render(transaction);
    expect(formatterValue).toEqual(
      `DEBIT  $100.55 USER_RECEIVABLES:1
CREDIT $100.55 SYSTEM_INCOME_PAID_PROJECTS
DEBIT  $3.00 USER_RECEIVABLES:1
CREDIT $3.00 SYSTEM_INCOME_PAYMENT_FEE`,
    );
  });
});
