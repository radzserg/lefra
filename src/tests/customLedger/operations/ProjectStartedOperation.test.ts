import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { ledgerAccountsRefBuilder } from '@/ledger/accounts/ledgerAccountsRefBuilder.js';
import { Ledger } from '@/ledger/Ledger.js';
import { InMemoryLedgerStorage } from '@/ledger/storage/inMemory/InMemoryLedgerStorage.js';
import { Unit } from '@/ledger/units/Unit.js';
import { buildCustomLedger } from '#/customLedger/buildCustomLedger.js';
import { CustomLedgerSpecification } from '#/customLedger/CustomLedgerSpecification.js';
import { ProjectStartedOperation } from '#/customLedger/operations/ProjectStartedOperation.js';
import { assertTransaction } from '#/helpers/assertTransaction.js';
import { expectBalanceEqual } from '#/helpers/expectBalanceEqual.js';
import { cad, usd } from '#/helpers/units.js';
import { describe, expect, test } from 'vitest';

const createServices = async () => {
  const storage = new InMemoryLedgerStorage();
  await buildCustomLedger(storage);

  const ledger = new Ledger(storage);

  const account = ledgerAccountsRefBuilder(CustomLedgerSpecification);

  return {
    account,
    ledger,
    storage,
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
          amountLockedForContractor: usd(50),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          clientUserId: 'string',
          contractorUserId,
          paymentProcessingFee: usd(5),
          platformFee: usd(10),
          targetNetAmount: usd(100),
        }),
      );
    }).rejects.toThrow('Invalid operation data');
  });

  test('records ProjectStartedOperation when payment is processing', async () => {
    const { account, ledger, storage } = await createServices();
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForContractor: usd(50),
        clientUserId,
        contractorUserId,
        payment: {
          chargeAmount: usd(105),
          estimatedStripeProcessingFee: usd(5),
          platformFee: null,
          status: 'PROCESSING',
          targetNetAmount: usd(100),
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

    const expectedBalances: Array<[LedgerAccountRef, Unit<'USD'> | null]> = [
      [account('USER_RECEIVABLES', clientUserId), usd(100)],
      [account('USER_PAYABLES_LOCKED', contractorUserId), usd(50)],
      [account('USER_PAYABLES', contractorUserId), usd(50)],
      [account('SYSTEM_INCOME_PAID_PROJECTS'), usd(100)],
      [account('SYSTEM_INCOME_CONTRACT_FEES'), usd(0)],
      [account('SYSTEM_EXPENSES_PAYOUTS'), usd(100)],
    ];

    for (const [accountRef, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(accountRef);
      expectBalanceEqual(
        actualBalance,
        expectedBalance,
        accountRef.accountSlug,
      );
    }
  });

  test('records ProjectStartedOperation when payment is confirmed', async () => {
    const { account, ledger, storage } = await createServices();
    const transaction = await ledger.record(
      new ProjectStartedOperation({
        amountLockedForContractor: usd(50),
        clientUserId,
        contractorUserId,
        payment: {
          actualAmountReceived: usd(121.3),
          actualNetAmount: usd(117.44),
          actualStripeProcessingFee: usd(3.86),

          chargeAmount: cad(115),
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

    const expectedBalances: Array<[LedgerAccountRef, Unit<'USD'>]> = [
      [account('USER_RECEIVABLES', clientUserId), usd(0)],
      [account('USER_PAYABLES_LOCKED', contractorUserId), usd(50)],
      [account('USER_PAYABLES', contractorUserId), usd(50)],
      [account('SYSTEM_INCOME_PAID_PROJECTS'), usd(100)],
      [account('SYSTEM_EXPENSES_PAYOUTS'), usd(100)],
      [account('SYSTEM_INCOME_CONTRACT_FEES'), usd(19)],
      [account('SYSTEM_INCOME_STRIPE_PAY_IN_FEES'), usd(3.3)],
      [account('SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES'), usd(3.3)],
      [account('SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES'), usd(0.55)],
      [account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'), usd(117.44)],
      [account('SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES'), usd(1.01)],
    ];

    for (const [accountRef, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(accountRef);
      expectBalanceEqual(
        actualBalance,
        expectedBalance,
        accountRef.accountSlug,
      );
    }
  });

  test('records ProjectStartedOperation when 2 payments are confirmed', async () => {
    const { account, ledger, storage } = await createServices();
    const payload = {
      amountLockedForContractor: usd(50),
      clientUserId,
      contractorUserId,
      payment: {
        actualAmountReceived: usd(122.3),
        actualNetAmount: usd(118.45),
        actualStripeProcessingFee: usd(3.85),

        chargeAmount: cad(115),
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

    const expectedBalances: Array<[LedgerAccountRef, Unit<'USD'>]> = [
      [account('USER_RECEIVABLES', clientUserId), usd(0)],
      [account('USER_PAYABLES_LOCKED', contractorUserId), usd(50)],
      [account('USER_PAYABLES_LOCKED', contractorTwoUserId), usd(50)],
      [account('USER_PAYABLES', contractorUserId), usd(50)],
      [account('USER_PAYABLES', contractorTwoUserId), usd(50)],
      [account('SYSTEM_INCOME_PAID_PROJECTS'), usd(200)],
      [account('SYSTEM_EXPENSES_PAYOUTS'), usd(200)],
      [account('SYSTEM_INCOME_CONTRACT_FEES'), usd(38)],
      [account('SYSTEM_INCOME_STRIPE_PAY_IN_FEES'), usd(6.6)],
      [account('SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES'), usd(6.6)],
      [account('SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES'), usd(1.1)],
      [account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'), usd(236.9)],
    ];

    for (const [accountRef, expectedBalance] of expectedBalances) {
      const actualBalance = await storage.fetchAccountBalance(accountRef);
      expectBalanceEqual(
        actualBalance,
        expectedBalance,
        accountRef.accountSlug,
      );
    }
  });
});
