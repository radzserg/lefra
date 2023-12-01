import { moneySchema, usdSchema } from '@/money/validation.js';
import { z } from 'zod';

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
