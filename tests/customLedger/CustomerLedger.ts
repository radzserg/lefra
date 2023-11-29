import {
  entityAccount,
  systemAccount as defaultSystemAccount,
} from '@/ledger/accounts/LedgerAccount.js';
import { moneySchema, usdSchema } from '@/money/validation.js';
import { z } from 'zod';

// this will be automatically generated

type UserLedgerAccountType = 'RECEIVABLES' | 'PAYABLE_LOCKED' | 'PAYABLE';
type SystemAccountType =
  | 'INCOME_PAID_PROJECTS'
  | 'INCOME_PAYMENT_FEE'
  | 'INCOME_CONTRACT_FEES'
  | 'EXPENSES_PAYOUTS'
  | 'EXPENSES_STRIPE_PAY_IN_FEES'
  | 'EXPENSES_STRIPE_CONTRACT_FEES'
  | 'CURRENT_ASSETS_STRIPE_PLATFORM_USA'
  | 'EXPENSES_CURRENCY_CONVERSION_LOSSES'
  | 'INCOME_STRIPE_PAY_IN_FEES'
  | 'INCOME_CURRENCY_CONVERSION_GAINS';

export const userAccount = (
  name: UserLedgerAccountType,
  userAccountId: number,
) => {
  return entityAccount(name, userAccountId, 'USER');
};

export const systemAccount = (name: SystemAccountType) => {
  return defaultSystemAccount(name);
};

const platformFeeSchema = z
  .object({
    chargeAmount: usdSchema,
    netAmount: usdSchema,
    stripeProcessingFee: usdSchema,
  })
  .strict();

export type PlatformFee = z.infer<typeof platformFeeSchema>;

const processingPaymentSchema = z
  .object({
    /**
     * The total amount that was charged to the payment method. Includes pay-in fees.
     */
    chargeAmount: moneySchema,

    estimatedStripeProcessingFee: usdSchema,
    /**
     * Charge that was applied as a platform fee.
     */
    platformFee: platformFeeSchema.nullable(),
    status: z.literal('PROCESSING'),
    /**
     * The target amount we want Contra to receive after fees + currency conversion
     */
    targetNetAmount: usdSchema,
  })
  .strict();

type ProcessingPayment = z.infer<typeof processingPaymentSchema>;

const confirmedPaymentSchema = z
  .object({
    /**
     * The final amount that Contra received from the charge, after currency conversion if applicacble. Before fees are deducted.
     */
    actualAmountReceived: usdSchema,
    /**
     * The actual amount Contra received in our platform account receive after fees + currency conversion
     */
    actualNetAmount: usdSchema,
    actualStripeProcessingFee: usdSchema,
    /**
     * The total amount that was charged to the payment method. Includes pay-in fees.
     */
    chargeAmount: moneySchema,

    estimatedStripeProcessingFee: usdSchema,
    /**
     * Charge that was applied as a platform fee.
     */
    platformFee: platformFeeSchema.nullable(),
    status: z.literal('CONFIRMED'),

    /**
     * The target amount we want Contra to receive after fees + currency conversion
     */
    targetNetAmount: usdSchema,
  })
  .strict();

export type ConfirmedPayment = z.infer<typeof confirmedPaymentSchema>;

export const paymentSchema = z.union([
  processingPaymentSchema,
  confirmedPaymentSchema,
]);
export type Payment = ProcessingPayment | ConfirmedPayment;
