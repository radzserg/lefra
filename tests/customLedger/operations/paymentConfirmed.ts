import { LedgerAccountsRefBuilder } from '@/ledger/accounts/LedgerAccountsRefBuilder.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { CustomLedgerSpecification } from '#/customLedger/CustomLedgerSpecification.js';
import { ConfirmedPayment } from '#/customLedger/importedTypes.js';

export const entriesForPaymentConfirmed = ({
  clientUserId,
  payment,
}: {
  clientUserId: number;
  payment: ConfirmedPayment;
}): TransactionDoubleEntries => {
  const { account } = new LedgerAccountsRefBuilder(CustomLedgerSpecification);
  const platformFee = payment.platformFee;
  const stripePayInFeeAmountMinusPlatformProcessingFee = platformFee
    ? payment.estimatedStripeProcessingFee.minus(
        platformFee.stripeProcessingFee,
      )
    : payment.estimatedStripeProcessingFee;
  const targetNetAmountMinusPlatformFee = platformFee
    ? payment.targetNetAmount.minus(platformFee.netAmount)
    : payment.targetNetAmount;
  const actualNetAmountMinusPlatformFee = platformFee
    ? payment.actualNetAmount.minus(platformFee.netAmount)
    : payment.actualNetAmount;

  const entries = new TransactionDoubleEntries();

  entries.push(
    doubleEntry(
      debit(
        account('USER_RECEIVABLES', clientUserId),
        stripePayInFeeAmountMinusPlatformProcessingFee,
      ),
      credit(
        account('SYSTEM_INCOME_STRIPE_PAY_IN_FEES'),
        stripePayInFeeAmountMinusPlatformProcessingFee,
      ),
      'User owes Stripe processing fee',
    ),
    doubleEntry(
      debit(
        account('SYSTEM_EXPENSES_STRIPE_PAY_IN_FEES'),
        stripePayInFeeAmountMinusPlatformProcessingFee,
      ),
      credit(
        account('USER_RECEIVABLES', clientUserId),
        stripePayInFeeAmountMinusPlatformProcessingFee,
      ),
      'Client successfully paid stripe fees',
    ),
  );

  if (platformFee) {
    // Client successfully paid Contra platform fee

    entries.push(
      doubleEntry(
        [
          debit(
            account('SYSTEM_EXPENSES_STRIPE_CONTRACT_FEES'),
            platformFee.stripeProcessingFee,
          ),
          debit(
            account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
            platformFee.netAmount,
          ),
        ],
        credit(
          account('USER_RECEIVABLES', clientUserId),
          platformFee.chargeAmount,
        ),
        'User paid platform fee',
      ),
    );
  }

  // If there was no difference between the targeted net amount and received net amount
  if (actualNetAmountMinusPlatformFee.equals(targetNetAmountMinusPlatformFee)) {
    entries.push(
      doubleEntry(
        debit(
          account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
          actualNetAmountMinusPlatformFee,
        ),
        credit(
          account('USER_RECEIVABLES', clientUserId),
          targetNetAmountMinusPlatformFee,
        ),
        'Client successfully paid project fee',
      ),
    );
  } else if (
    actualNetAmountMinusPlatformFee.isLessThan(targetNetAmountMinusPlatformFee)
  ) {
    // Client technically underpaid due to currency exchange (Contra covers the difference)
    const delta = targetNetAmountMinusPlatformFee.minus(
      actualNetAmountMinusPlatformFee,
    );

    entries.push(
      doubleEntry(
        [
          debit(account('SYSTEM_EXPENSES_CURRENCY_CONVERSION_LOSSES'), delta),
          debit(
            account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
            actualNetAmountMinusPlatformFee,
          ),
        ],
        credit(
          account('USER_RECEIVABLES', clientUserId),
          targetNetAmountMinusPlatformFee,
        ),
        'Tracking currency conversion losses',
      ),
    );
  } else if (
    actualNetAmountMinusPlatformFee.isGreaterThan(
      targetNetAmountMinusPlatformFee,
    )
  ) {
    // Client technically overpaid due to currency exchange (Contra gains the difference)
    const delta = actualNetAmountMinusPlatformFee.minus(
      targetNetAmountMinusPlatformFee,
    );

    entries.push(
      doubleEntry(
        debit(
          account('SYSTEM_CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
          actualNetAmountMinusPlatformFee,
        ),
        [
          credit(account('SYSTEM_INCOME_CURRENCY_CONVERSION_GAINS'), delta),
          credit(
            account('USER_RECEIVABLES', clientUserId),
            targetNetAmountMinusPlatformFee,
          ),
        ],
        'Tracking currency conversion gains',
      ),
    );
  }

  return entries;
};
