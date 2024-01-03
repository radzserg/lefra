import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { TransactionFlowRenderer } from '@/ledger/renderer/TransactionFlowRenderer.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
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

describe('TransactionFlowRenderer', () => {
  const renderer = new TransactionFlowRenderer();

  test('render transaction', () => {
    const transaction = new Transaction(
      TransactionDoubleEntries.empty<'USD'>().push(
        doubleEntry(
          debit(userReceivables, usd(100)),
          credit(incomePaidProjects, usd(100)),
          'User owes money for goods',
        ),
        doubleEntry(
          debit(userReceivables, usd(3)),
          credit(incomePaymentFee, usd(3)),
        ),
      ),
    );

    const formatterValue = renderer.render(transaction);
    expect(formatterValue)
      .toEqual(`Account                              DEBIT        CREDIT
USER_RECEIVABLES:1              USD:100.00                  User owes money for goods
SYSTEM_INCOME_PAID_PROJECTS                   USD:100.00

USER_RECEIVABLES:1                USD:3.00                  
SYSTEM_INCOME_PAYMENT_FEE                       USD:3.00
`);
  });

  test('render transaction with inline balances', () => {
    const transaction = new Transaction(
      TransactionDoubleEntries.empty<'USD'>().push(
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
      'User makes payment',
    );

    const formatterValue = renderer.render(transaction, {
      showInlineBalance: true,
    });
    expect(formatterValue).toEqual(
      `Description: User makes payment

Account                              DEBIT        CREDIT       BALANCE
USER_RECEIVABLES:1              USD:100.00                  USD:100.00    User owes money for goods
SYSTEM_INCOME_PAID_PROJECTS                   USD:100.00    USD:100.00

USER_RECEIVABLES:1                USD:3.00                  USD:103.00    User owes payment processing fee
SYSTEM_INCOME_PAYMENT_FEE                       USD:3.00      USD:3.00
`,
    );
  });

  test('render transaction with final balances', () => {
    const transaction = new Transaction(
      TransactionDoubleEntries.empty<'USD'>().push(
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
      'User makes payment',
    );

    const formatterValue = renderer.render(transaction, {
      showFinalBalances: true,
    });
    expect(formatterValue).toEqual(
      `Description: User makes payment

Account                              DEBIT        CREDIT
USER_RECEIVABLES:1              USD:100.00                  User owes money for goods
SYSTEM_INCOME_PAID_PROJECTS                   USD:100.00

USER_RECEIVABLES:1                USD:3.00                  User owes payment processing fee
SYSTEM_INCOME_PAYMENT_FEE                       USD:3.00

Final balances:
USER_RECEIVABLES:1          USD:103.00
SYSTEM_INCOME_PAID_PROJECTS USD:100.00
SYSTEM_INCOME_PAYMENT_FEE   USD:3.00`,
    );
  });
});
