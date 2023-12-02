import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { Ledger } from '@/ledger/Ledger.js';
import { UuidDatabaseIdGenerator } from '@/ledger/storage/DatabaseIdGenerator.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/inMemory/InMemoryLedgerStorage.js';
import { Money, usd } from '@/money/Money.js';
import { buildCustomLedger } from '#/customLedger/buildCustomLedger.js';
import { customLedgerAccountFactory } from '#/customLedger/customLedgerAccountFactory.js';
import { ProjectStartedOperation } from '#/customLedger/operations/ProjectStartedOperation.js';
import { assertTransaction } from '#/helpers/assertTransaction.js';
import { expectBalanceEqual } from '#/helpers/expectBalanceEqual.js';
import { describe, expect, test } from 'vitest';

const createServices = async () => {
  const ledgerId = new UuidDatabaseIdGenerator().generateId();

  const storage = new InMemoryLedgerStorage();
  const ledger = new Ledger(ledgerId, storage);
  await buildCustomLedger(ledgerId, storage);
  const { systemAccount, userAccount } = customLedgerAccountFactory(ledgerId);

  return {
    ledger,
    storage,
    systemAccount,
    userAccount,
  };
};

describe('ProjectStartedOperation', () => {
  const clientUserId = 1_011;
  const contractorUserId = 100;

  test('try to pass incorrect payload', async () => {
    const { ledger } = await createServices();
    await expect(async () => {
      await ledger.record(
        new ProjectStartedOperation({
          amountLockedForContractor: new Money(50, 'USD'),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          clientUserId: 'string',
          contractorUserId,
          ledgerId: ledger.id,
          paymentProcessingFee: new Money(5, 'USD'),
          platformFee: new Money(10, 'USD'),
          targetNetAmount: new Money(100, 'USD'),
        }),
      );
    }).rejects.toThrow('Invalid operation data');
  });

  test('records ProjectStartedOperation when payment is processing', async () => {
    const { ledger, storage, systemAccount, userAccount } =
      await createServices();
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForContractor: new Money(50, 'USD'),
        clientUserId,
        contractorUserId,
        ledgerId: ledger.id,
        payment: {
          chargeAmount: new Money(105, 'USD'),
          estimatedStripeProcessingFee: new Money(5, 'USD'),
          platformFee: null,
          status: 'PROCESSING',
          targetNetAmount: new Money(100, 'USD'),
        },
      }),
    );

    expect(true).toBe(true);
    expect(transaction).not.toBeNull();

    await assertTransaction(transaction, {
      entries: [
        // user owes money for the project
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(100)],
        ['CREDIT', 'SYSTEM_INCOME_PAID_PROJECTS', usd(100)],

        ['DEBIT', 'SYSTEM_EXPENSES_PAYOUTS', usd(100)],
        ['CREDIT', `USER_PAYABLES_LOCKED:${contractorUserId}`, usd(50)],
        ['CREDIT', `USER_PAYABLES:${contractorUserId}`, usd(50)],
      ],
    });

    const expectedBalances: Array<[LedgerAccountRef, Money | null]> = [
      [userAccount('RECEIVABLES', clientUserId), usd(100)],
      [userAccount('PAYABLES_LOCKED', contractorUserId), usd(50)],
      [userAccount('PAYABLES', contractorUserId), usd(50)],
      [systemAccount('INCOME_PAID_PROJECTS'), usd(100)],
      [systemAccount('INCOME_CONTRACT_FEES'), null],
      [systemAccount('EXPENSES_PAYOUTS'), usd(100)],
    ];

    for (const [account, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(account);
      expectBalanceEqual(actualBalance, expectedBalance, account.slug);
    }
  });

  test('records ProjectStartedOperation when payment is confirmed', async () => {
    const { ledger, storage, systemAccount, userAccount } =
      await createServices();
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForContractor: new Money(50, 'USD'),
        clientUserId,
        contractorUserId,
        ledgerId: ledger.id,
        payment: {
          actualAmountReceived: usd(121.3),
          actualNetAmount: usd(117.44),
          actualStripeProcessingFee: usd(3.86),

          chargeAmount: new Money(115, 'EUR'),
          estimatedStripeProcessingFee: usd(3.85),
          platformFee: {
            chargeAmount: usd(19),
            netAmount: usd(18.45),
            stripeProcessingFee: usd(0.55),
          },
          status: 'CONFIRMED',
          targetNetAmount: usd(118.45),
        },
      }),
    );

    expect(true).toBe(true);
    expect(transaction).not.toBeNull();

    await assertTransaction(transaction, {
      entries: [
        // user owes money for the project
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(100)],
        ['CREDIT', 'SYSTEM_INCOME_PAID_PROJECTS', usd(100)],

        // user owes platform fee
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(19)],
        ['CREDIT', 'SYSTEM_INCOME_CONTRACT_FEES', usd(19)],

        ['DEBIT', 'SYSTEM_EXPENSES_PAYOUTS', usd(100)],
        ['CREDIT', `USER_PAYABLES_LOCKED:${contractorUserId}`, usd(50)],
        ['CREDIT', `USER_PAYABLES:${contractorUserId}`, usd(50)],

        // user owes stripe processing fee
        ['DEBIT', `USER_RECEIVABLES:${clientUserId}`, usd(3.3)],
        ['CREDIT', 'SYSTEM_INCOME_STRIPE_PAY_IN_FEES', usd(3.3)],

        // user successfully paid stripe fees
        ['DEBIT', `SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES`, usd(3.3)],
        ['CREDIT', `USER_RECEIVABLES:${clientUserId}`, usd(3.3)],

        // Client paid platform fee
        ['DEBIT', `SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES`, usd(0.55)],
        ['DEBIT', `SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA`, usd(18.45)],
        ['CREDIT', `USER_RECEIVABLES:${clientUserId}`, usd(19)],

        // Client paid for the project
        ['DEBIT', `SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES`, usd(1.01)],
        ['DEBIT', `SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA`, usd(98.99)],
        ['CREDIT', `USER_RECEIVABLES:${clientUserId}`, usd(100)],
      ],
    });

    const expectedBalances: Array<[LedgerAccountRef, Money]> = [
      [userAccount('RECEIVABLES', clientUserId), usd(0)],
      [userAccount('PAYABLES_LOCKED', contractorUserId), usd(50)],
      [userAccount('PAYABLES', contractorUserId), usd(50)],
      [systemAccount('INCOME_PAID_PROJECTS'), usd(100)],
      [systemAccount('EXPENSES_PAYOUTS'), usd(100)],
      [systemAccount('INCOME_CONTRACT_FEES'), usd(19)],
      [systemAccount('INCOME_STRIPE_PAY_IN_FEES'), usd(3.3)],
      [systemAccount('EXPENSES_STRIPE_PAY_IN_FEES'), usd(3.3)],
      [systemAccount('EXPENSES_STRIPE_CONTRACT_FEES'), usd(0.55)],
      [systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'), usd(117.44)],
      [systemAccount('EXPENSES_CURRENCY_CONVERSION_LOSSES'), usd(1.01)],
    ];

    for (const [account, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(account);
      expectBalanceEqual(actualBalance, expectedBalance, account.slug);
    }
  });

  test('records ProjectStartedOperation when 2 payments are confirmed', async () => {
    const { ledger, storage, systemAccount, userAccount } =
      await createServices();
    const payload = {
      amountLockedForContractor: new Money(50, 'USD'),
      clientUserId,
      contractorUserId,
      ledgerId: ledger.id,
      payment: {
        actualAmountReceived: usd(122.3),
        actualNetAmount: usd(118.45),
        actualStripeProcessingFee: usd(3.85),

        chargeAmount: new Money(115, 'EUR'),
        estimatedStripeProcessingFee: usd(3.85),
        platformFee: {
          chargeAmount: usd(19),
          netAmount: usd(18.45),
          stripeProcessingFee: usd(0.55),
        },
        status: 'CONFIRMED' as const,
        targetNetAmount: usd(118.45),
      },
    };
    const contractorTwoUserId = 101;
    await ledger.record(new ProjectStartedOperation(payload));
    await ledger.record(
      new ProjectStartedOperation({
        ...payload,
        contractorUserId: contractorTwoUserId,
      }),
    );

    const expectedBalances: Array<[LedgerAccountRef, Money]> = [
      [userAccount('RECEIVABLES', clientUserId), usd(0)],
      [userAccount('PAYABLES_LOCKED', contractorUserId), usd(50)],
      [userAccount('PAYABLES_LOCKED', contractorTwoUserId), usd(50)],
      [userAccount('PAYABLES', contractorUserId), usd(50)],
      [userAccount('PAYABLES', contractorTwoUserId), usd(50)],
      [systemAccount('INCOME_PAID_PROJECTS'), usd(200)],
      [systemAccount('EXPENSES_PAYOUTS'), usd(200)],
      [systemAccount('INCOME_CONTRACT_FEES'), usd(38)],
      [systemAccount('INCOME_STRIPE_PAY_IN_FEES'), usd(6.6)],
      [systemAccount('EXPENSES_STRIPE_PAY_IN_FEES'), usd(6.6)],
      [systemAccount('EXPENSES_STRIPE_CONTRACT_FEES'), usd(1.1)],
      [systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'), usd(236.9)],
    ];

    for (const [account, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(account);
      expectBalanceEqual(actualBalance, expectedBalance, account.slug);
    }
  });
});
