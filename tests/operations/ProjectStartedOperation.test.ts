import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { Ledger } from '@/ledger/Ledger.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/InMemoryStorage.js';
import { Money, usd } from '@/money/Money.js';
import { systemAccount, userAccount } from '#/customLedger/CustomerLedger.js';
import { ProjectStartedOperation } from '#/customLedger/operations/ProjectStartedOperation.js';
import { assertTransaction } from '#/helpers/assertTransaction.js';
import { v4 as uuid } from 'uuid';
import { beforeAll, describe, expect, test } from 'vitest';

describe('ProjectStartedOperation', () => {
  const ledgerId = uuid();
  const storage = new InMemoryLedgerStorage();
  const ledger = new Ledger(ledgerId, storage);
  const clientUserId = 1;
  const contractorUserId = 2;

  beforeAll(async () => {
    await storage.saveAccounts(ledgerId, [
      [systemAccount('INCOME_PAID_PROJECTS'), 'CREDIT'],
      [systemAccount('INCOME_PAYMENT_FEE'), 'CREDIT'],
      [systemAccount('INCOME_CONTRACT_FEES'), 'CREDIT'],
      [systemAccount('EXPENSES_PAYOUTS'), 'DEBIT'],
    ]);

    await storage.saveEntityAccountTypes(ledgerId, [
      ['USER_RECEIVABLES', 'DEBIT'],
      ['USER_PAYABLE_LOCKED', 'CREDIT'],
      ['USER_PAYABLE', 'CREDIT'],
    ]);
  });

  test('try to pass incorrect payload', async () => {
    await expect(async () => {
      await ledger.record(
        new ProjectStartedOperation({
          amountLockedForContractor: new Money(50, 'USD'),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          clientUserId: 'string',
          contractorUserId,
          paymentProcessingFee: new Money(5, 'USD'),
          platformFee: new Money(10, 'USD'),
          targetNetAmount: new Money(100, 'USD'),
        }),
      );
    }).rejects.toThrow('Invalid operation data');
  });

  test('records ProjectStartedOperation when payment is processing', async () => {
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForContractor: new Money(50, 'USD'),
        clientUserId,
        contractorUserId,
        payment: {
          chargeAmount: new Money(105, 'USD'),
          estimatedStripeProcessingFee: new Money(5, 'USD'),
          platformFee: {
            chargeAmount: new Money(10, 'USD'),
            netAmount: new Money(10, 'USD'),
            stripeProcessingFee: new Money(0, 'USD'),
          },
          status: 'PROCESSING',
          targetNetAmount: new Money(100, 'USD'),
        },
      }),
    );

    expect(true).toBe(true);
    expect(transaction).not.toBeNull();

    assertTransaction(transaction, {
      entries: [
        // user owes money for the project
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(100)],
        ['CREDIT', 'SYSTEM_INCOME_PAID_PROJECTS', usd(100)],

        // user owes platform fee
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(10)],
        ['CREDIT', 'SYSTEM_INCOME_CONTRACT_FEES', usd(10)],

        ['DEBIT', 'SYSTEM_EXPENSES_PAYOUTS', usd(100)],
        ['CREDIT', `USER_PAYABLE_LOCKED:${contractorUserId}`, usd(50)],
        ['CREDIT', `USER_PAYABLE:${contractorUserId}`, usd(50)],
      ],
    });

    const expectedBalances: Array<[LedgerAccount, Money]> = [
      [userAccount('RECEIVABLES', clientUserId), usd(110)],
      [userAccount('PAYABLE_LOCKED', contractorUserId), usd(50)],
      [userAccount('PAYABLE', contractorUserId), usd(50)],
      [systemAccount('INCOME_PAID_PROJECTS'), usd(100)],
      [systemAccount('INCOME_CONTRACT_FEES'), usd(10)],
      [systemAccount('EXPENSES_PAYOUTS'), usd(100)],
    ];

    for (const [account, expectedBalance] of expectedBalances) {
      await expect(
        storage.fetchAccountBalance(ledgerId, account),
      ).resolves.toEqual(expectedBalance);
    }
  });
});
