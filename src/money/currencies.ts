import { BigNumber } from 'bignumber.js';

export const currencyCodes = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRO',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SEK',
  'SGD',
  'SHP',
  'SLE',
  'SLL',
  'SOS',
  'SRD',
  'STD',
  'SZL',
  'THB',
  'TJS',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'USDC',
  'UYU',
  'UZS',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XCD',
  'XOF',
  'XPF',
  'YER',
  'ZAR',
  'ZMW',
] as const;

export type CurrencyCode = (typeof currencyCodes)[number];

export type Currency<C extends CurrencyCode> = {
  readonly code: C;
  readonly customConvertorFromStripeAmount?: (amount: number) => BigNumber;
  readonly customConvertorToStripeAmount?: (amount: BigNumber) => number;
  readonly customConvertorToStripePayoutAmount?: (amount: BigNumber) => number;
  readonly standardNumberOfDigits: 0 | 2 | 3;
};

export const currencyByCode: {
  [code in CurrencyCode]: Currency<code>;
} = {
  AED: {
    code: 'AED',
    standardNumberOfDigits: 2,
  },
  AFN: {
    code: 'AFN',
    standardNumberOfDigits: 2,
  },
  ALL: {
    code: 'ALL',
    standardNumberOfDigits: 2,
  },
  AMD: {
    code: 'AMD',
    standardNumberOfDigits: 2,
  },
  ANG: {
    code: 'ANG',
    standardNumberOfDigits: 2,
  },
  AOA: {
    code: 'AOA',
    standardNumberOfDigits: 2,
  },
  ARS: {
    code: 'ARS',
    standardNumberOfDigits: 2,
  },
  AUD: {
    code: 'AUD',
    standardNumberOfDigits: 2,
  },
  AWG: {
    code: 'AWG',
    standardNumberOfDigits: 2,
  },
  AZN: {
    code: 'AZN',
    standardNumberOfDigits: 2,
  },
  BAM: {
    code: 'BAM',
    standardNumberOfDigits: 2,
  },
  BBD: {
    code: 'BBD',
    standardNumberOfDigits: 2,
  },
  BDT: {
    code: 'BDT',
    standardNumberOfDigits: 2,
  },
  BGN: {
    code: 'BGN',
    standardNumberOfDigits: 2,
  },
  BHD: {
    code: 'BHD',
    standardNumberOfDigits: 3,
  },
  BIF: {
    code: 'BIF',
    standardNumberOfDigits: 0,
  },
  BMD: {
    code: 'BMD',
    standardNumberOfDigits: 2,
  },
  BND: {
    code: 'BND',
    standardNumberOfDigits: 2,
  },
  BOB: {
    code: 'BOB',
    standardNumberOfDigits: 2,
  },
  BRL: {
    code: 'BRL',
    standardNumberOfDigits: 2,
  },
  BSD: {
    code: 'BSD',
    standardNumberOfDigits: 2,
  },
  BTN: {
    code: 'BTN',
    standardNumberOfDigits: 2,
  },
  BWP: {
    code: 'BWP',
    standardNumberOfDigits: 2,
  },
  BYN: {
    code: 'BYN',
    standardNumberOfDigits: 2,
  },
  BZD: {
    code: 'BZD',
    standardNumberOfDigits: 2,
  },
  CAD: {
    code: 'CAD',
    standardNumberOfDigits: 2,
  },
  CDF: {
    code: 'CDF',
    standardNumberOfDigits: 2,
  },
  CHF: {
    code: 'CHF',
    standardNumberOfDigits: 2,
  },
  CLP: {
    code: 'CLP',
    standardNumberOfDigits: 0,
  },
  CNY: {
    code: 'CNY',
    standardNumberOfDigits: 2,
  },
  COP: {
    code: 'COP',
    standardNumberOfDigits: 2,
  },
  CRC: {
    code: 'CRC',
    standardNumberOfDigits: 2,
  },
  CVE: {
    code: 'CVE',
    standardNumberOfDigits: 2,
  },
  CZK: {
    code: 'CZK',
    standardNumberOfDigits: 2,
  },
  DJF: {
    code: 'DJF',
    standardNumberOfDigits: 0,
  },
  DKK: {
    code: 'DKK',
    standardNumberOfDigits: 2,
  },
  DOP: {
    code: 'DOP',
    standardNumberOfDigits: 2,
  },
  DZD: {
    code: 'DZD',
    standardNumberOfDigits: 2,
  },
  EGP: {
    code: 'EGP',
    standardNumberOfDigits: 2,
  },
  ETB: {
    code: 'ETB',
    standardNumberOfDigits: 2,
  },
  EUR: {
    code: 'EUR',
    standardNumberOfDigits: 2,
  },
  FJD: {
    code: 'FJD',
    standardNumberOfDigits: 2,
  },
  FKP: {
    code: 'FKP',
    standardNumberOfDigits: 2,
  },
  GBP: {
    code: 'GBP',
    standardNumberOfDigits: 2,
  },
  GEL: {
    code: 'GEL',
    standardNumberOfDigits: 2,
  },
  GHS: {
    code: 'GHS',
    standardNumberOfDigits: 2,
  },
  GIP: {
    code: 'GIP',
    standardNumberOfDigits: 2,
  },
  GMD: {
    code: 'GMD',
    standardNumberOfDigits: 2,
  },
  GNF: {
    code: 'GNF',
    standardNumberOfDigits: 0,
  },
  GTQ: {
    code: 'GTQ',
    standardNumberOfDigits: 2,
  },
  GYD: {
    code: 'GYD',
    standardNumberOfDigits: 2,
  },
  HKD: {
    code: 'HKD',
    standardNumberOfDigits: 2,
  },
  HNL: {
    code: 'HNL',
    standardNumberOfDigits: 2,
  },
  HRK: {
    code: 'HRK',
    standardNumberOfDigits: 2,
  },
  HTG: {
    code: 'HTG',
    standardNumberOfDigits: 2,
  },
  HUF: {
    code: 'HUF',
    /**
     * From: https://stripe.com/docs/currencies?presentment-currency=US#special-cases
     *
     * Stripe treats HUF as a zero-decimal currency for payouts, even though you can charge two-decimal amounts.
     * When you create a manual payout in HUF, only integer amounts that are evenly divisible by 100 are allowed.
     * For example, if you have an available balance of HUF 10.45, you can pay out HUF 10 by submitting 1000 for the amount value.
     * You can’t submit a payout for the full balance, HUF 10.45, because the amount value of 1045 is not evenly divisible by 100.
     */
    customConvertorToStripePayoutAmount: (amount) => {
      return amount.decimalPlaces(0).multipliedBy(100).toNumber();
    },
    standardNumberOfDigits: 2,
  },
  IDR: {
    code: 'IDR',
    standardNumberOfDigits: 2,
  },
  ILS: {
    code: 'ILS',
    standardNumberOfDigits: 2,
  },
  INR: {
    code: 'INR',
    standardNumberOfDigits: 2,
  },
  ISK: {
    code: 'ISK',
    standardNumberOfDigits: 2,
  },
  JMD: {
    code: 'JMD',
    standardNumberOfDigits: 2,
  },
  JOD: {
    code: 'JOD',
    standardNumberOfDigits: 3,
  },
  JPY: {
    code: 'JPY',
    standardNumberOfDigits: 0,
  },
  KES: {
    code: 'KES',
    standardNumberOfDigits: 2,
  },
  KGS: {
    code: 'KGS',
    standardNumberOfDigits: 2,
  },
  KHR: {
    code: 'KHR',
    standardNumberOfDigits: 2,
  },
  KMF: {
    code: 'KMF',
    standardNumberOfDigits: 0,
  },
  KRW: {
    code: 'KRW',
    standardNumberOfDigits: 0,
  },
  KWD: {
    code: 'KWD',
    standardNumberOfDigits: 3,
  },
  KYD: {
    code: 'KYD',
    standardNumberOfDigits: 2,
  },
  KZT: {
    code: 'KZT',
    standardNumberOfDigits: 2,
  },
  LAK: {
    code: 'LAK',
    standardNumberOfDigits: 2,
  },
  LBP: {
    code: 'LBP',
    standardNumberOfDigits: 2,
  },
  LKR: {
    code: 'LKR',
    standardNumberOfDigits: 2,
  },
  LRD: {
    code: 'LRD',
    standardNumberOfDigits: 2,
  },
  LSL: {
    code: 'LSL',
    standardNumberOfDigits: 2,
  },
  MAD: {
    code: 'MAD',
    standardNumberOfDigits: 2,
  },
  MDL: {
    code: 'MDL',
    standardNumberOfDigits: 2,
  },
  MGA: {
    code: 'MGA',
    standardNumberOfDigits: 0,
  },
  MKD: {
    code: 'MKD',
    standardNumberOfDigits: 2,
  },
  MMK: {
    code: 'MMK',
    standardNumberOfDigits: 2,
  },
  MNT: {
    code: 'MNT',
    standardNumberOfDigits: 2,
  },
  MOP: {
    code: 'MOP',
    standardNumberOfDigits: 2,
  },
  MRO: {
    code: 'MRO',
    standardNumberOfDigits: 2,
  },
  MUR: {
    code: 'MUR',
    standardNumberOfDigits: 2,
  },
  MVR: {
    code: 'MVR',
    standardNumberOfDigits: 2,
  },
  MWK: {
    code: 'MWK',
    standardNumberOfDigits: 2,
  },
  MXN: {
    code: 'MXN',
    standardNumberOfDigits: 2,
  },
  MYR: {
    code: 'MYR',
    standardNumberOfDigits: 2,
  },
  MZN: {
    code: 'MZN',
    standardNumberOfDigits: 2,
  },
  NAD: {
    code: 'NAD',
    standardNumberOfDigits: 2,
  },
  NGN: {
    code: 'NGN',
    standardNumberOfDigits: 2,
  },
  NIO: {
    code: 'NIO',
    standardNumberOfDigits: 2,
  },
  NOK: {
    code: 'NOK',
    standardNumberOfDigits: 2,
  },
  NPR: {
    code: 'NPR',
    standardNumberOfDigits: 2,
  },
  NZD: {
    code: 'NZD',
    standardNumberOfDigits: 2,
  },
  OMR: {
    code: 'OMR',
    standardNumberOfDigits: 3,
  },
  PAB: {
    code: 'PAB',
    standardNumberOfDigits: 2,
  },
  PEN: {
    code: 'PEN',
    standardNumberOfDigits: 2,
  },
  PGK: {
    code: 'PGK',
    standardNumberOfDigits: 2,
  },
  PHP: {
    code: 'PHP',
    standardNumberOfDigits: 2,
  },
  PKR: {
    code: 'PKR',
    standardNumberOfDigits: 2,
  },
  PLN: {
    code: 'PLN',
    standardNumberOfDigits: 2,
  },
  PYG: {
    code: 'PYG',
    standardNumberOfDigits: 0,
  },
  QAR: {
    code: 'QAR',
    standardNumberOfDigits: 2,
  },
  RON: {
    code: 'RON',
    standardNumberOfDigits: 2,
  },
  RSD: {
    code: 'RSD',
    standardNumberOfDigits: 2,
  },
  RUB: {
    code: 'RUB',
    standardNumberOfDigits: 2,
  },
  RWF: {
    code: 'RWF',
    standardNumberOfDigits: 0,
  },
  SAR: {
    code: 'SAR',
    standardNumberOfDigits: 2,
  },
  SBD: {
    code: 'SBD',
    standardNumberOfDigits: 2,
  },
  SCR: {
    code: 'SCR',
    standardNumberOfDigits: 2,
  },
  SEK: {
    code: 'SEK',
    standardNumberOfDigits: 2,
  },
  SGD: {
    code: 'SGD',
    standardNumberOfDigits: 2,
  },
  SHP: {
    code: 'SHP',
    standardNumberOfDigits: 2,
  },
  SLE: {
    code: 'SLE',
    standardNumberOfDigits: 2,
  },
  SLL: {
    code: 'SLL',
    standardNumberOfDigits: 2,
  },
  SOS: {
    code: 'SOS',
    standardNumberOfDigits: 2,
  },
  SRD: {
    code: 'SRD',
    standardNumberOfDigits: 2,
  },
  STD: {
    code: 'STD',
    standardNumberOfDigits: 2,
  },
  SZL: {
    code: 'SZL',
    standardNumberOfDigits: 2,
  },
  THB: {
    code: 'THB',
    standardNumberOfDigits: 2,
  },
  TJS: {
    code: 'TJS',
    standardNumberOfDigits: 2,
  },
  TND: {
    code: 'TND',
    standardNumberOfDigits: 3,
  },
  TOP: {
    code: 'TOP',
    standardNumberOfDigits: 2,
  },
  TRY: {
    code: 'TRY',
    standardNumberOfDigits: 2,
  },
  TTD: {
    code: 'TTD',
    standardNumberOfDigits: 2,
  },
  TWD: {
    code: 'TWD',
    /**
     * From: https://stripe.com/docs/currencies?presentment-currency=US#special-cases
     *
     * Stripe treats TWD as a zero-decimal currency for payouts, even though you can charge two-decimal amounts.
     * When you create a manual payout in TWD, only integer amounts that are evenly divisible by 100 are allowed.
     * For example, if you have an available balance of TWD 800.45, you can pay out TWD 800 by submitting 80000 for the amount value.
     * You can’t submit a payout for the full balance, TWD 800.45, because the amount value of 80045 is not evenly divisible by 100.
     */
    customConvertorToStripePayoutAmount: (amount: BigNumber): number => {
      return amount.decimalPlaces(0).multipliedBy(100).toNumber();
    },
    standardNumberOfDigits: 2,
  },
  TZS: {
    code: 'TZS',
    standardNumberOfDigits: 2,
  },
  UAH: {
    code: 'UAH',
    standardNumberOfDigits: 2,
  },
  UGX: {
    code: 'UGX',
    /**
     * From: https://stripe.com/docs/currencies?presentment-currency=US#special-cases
     *
     * UGX was a decimal-based currency, but is now effectively a zero-decimal currency.
     * To maintain backwards compatibility, you must pass in amounts with two decimals.
     * For example, to charge 5 UGX, provide an amount value of 500.
     * The amount value must be evenly divisible by 100: 100, 200, 300, and so on.
     * In other words, you can’t charge fractions of UGX.
     */
    customConvertorFromStripeAmount: (amount: number): BigNumber => {
      return new BigNumber(amount).dividedBy(100);
    },

    customConvertorToStripeAmount: (amount: BigNumber): number => {
      return amount.multipliedBy(100).decimalPlaces(0).toNumber();
    },
    customConvertorToStripePayoutAmount: (amount: BigNumber): number => {
      return amount.multipliedBy(100).decimalPlaces(0).toNumber();
    },
    standardNumberOfDigits: 0,
  },
  USD: {
    code: 'USD',
    standardNumberOfDigits: 2,
  },
  USDC: {
    code: 'USDC',
    standardNumberOfDigits: 2,
  },
  UYU: {
    code: 'UYU',
    standardNumberOfDigits: 2,
  },
  UZS: {
    code: 'UZS',
    standardNumberOfDigits: 2,
  },
  VND: {
    code: 'VND',
    standardNumberOfDigits: 0,
  },
  VUV: {
    code: 'VUV',
    standardNumberOfDigits: 0,
  },
  WST: {
    code: 'WST',
    standardNumberOfDigits: 2,
  },
  XAF: {
    code: 'XAF',
    standardNumberOfDigits: 0,
  },
  XCD: {
    code: 'XCD',
    standardNumberOfDigits: 2,
  },
  XOF: {
    code: 'XOF',
    standardNumberOfDigits: 0,
  },
  XPF: {
    code: 'XPF',
    standardNumberOfDigits: 0,
  },
  YER: {
    code: 'YER',
    standardNumberOfDigits: 2,
  },
  ZAR: {
    code: 'ZAR',
    standardNumberOfDigits: 2,
  },
  ZMW: {
    code: 'ZMW',
    standardNumberOfDigits: 2,
  },
};
