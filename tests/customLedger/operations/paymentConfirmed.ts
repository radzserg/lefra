import { LedgerAccountRefBuilder } from '@/ledger/accounts/EntityAccountRef.js';
import { doubleEntry } from '@/ledger/transaction/DoubleEntry.js';
import { credit, debit } from '@/ledger/transaction/Entry.js';
import { TransactionDoubleEntries } from '@/ledger/transaction/TransactionDoubleEntries.js';
import { ConfirmedPayment } from '#/customLedger/importedTypes.js';

export const entriesForPaymentConfirmed = ({
  clientUserId,
  payment,
  systemAccount,
  userAccount,
}: {
  clientUserId: number;
  payment: ConfirmedPayment;
  systemAccount: LedgerAccountRefBuilder;
  userAccount: LedgerAccountRefBuilder;
}): TransactionDoubleEntries => {
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
  // prettier-ignore
  entries.push(
    doubleEntry(
      debit(userAccount('RECEIVABLES', clientUserId), stripePayInFeeAmountMinusPlatformProcessingFee),
      credit(systemAccount('INCOME_STRIPE_PAY_IN_FEES'), stripePayInFeeAmountMinusPlatformProcessingFee),
      'User owes Stripe processing fee',
    ),
    doubleEntry(
      debit(systemAccount('EXPENSES_STRIPE_PAY_IN_FEES'), stripePayInFeeAmountMinusPlatformProcessingFee),
      credit(userAccount('RECEIVABLES', clientUserId), stripePayInFeeAmountMinusPlatformProcessingFee),
      'Client successfully paid stripe fees',
    ),
  );

  if (platformFee) {
    // Client successfully paid Contra platform fee
    // prettier-ignore
    entries.push(
      doubleEntry(
        [
          debit(systemAccount('EXPENSES_STRIPE_CONTRACT_FEES'), platformFee.stripeProcessingFee),
          debit(systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'), platformFee.netAmount)
        ],
        credit(userAccount('RECEIVABLES', clientUserId), platformFee.chargeAmount),
        'User owes platform fee',
      ),
    );
  }

  // If there was no difference between the targeted net amount and received net amount
  if (actualNetAmountMinusPlatformFee.equals(targetNetAmountMinusPlatformFee)) {
    entries.push(
      doubleEntry(
        debit(
          systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
          actualNetAmountMinusPlatformFee,
        ),
        credit(
          userAccount('RECEIVABLES', clientUserId),
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
          debit(systemAccount('EXPENSES_CURRENCY_CONVERSION_LOSSES'), delta),
          debit(
            systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
            actualNetAmountMinusPlatformFee,
          ),
        ],
        credit(
          userAccount('RECEIVABLES', clientUserId),
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
          systemAccount('CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
          actualNetAmountMinusPlatformFee,
        ),
        [
          credit(systemAccount('INCOME_CURRENCY_CONVERSION_GAINS'), delta),
          credit(
            userAccount('RECEIVABLES', clientUserId),
            targetNetAmountMinusPlatformFee,
          ),
        ],
        'Tracking currency conversion gains',
      ),
    );
  }

  return entries;
};
