import {
  type Currency,
  currencyByCode,
  type CurrencyCode,
} from './currencies.js';
import { BigNumber } from 'bignumber.js';

const NUM_DECIMAL_PLACES = 8;

// Follow "banker's rounding"
BigNumber.config({
  DECIMAL_PLACES: NUM_DECIMAL_PLACES,
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN,
});

/**
 * Serialized string form of the `Money` type. Can be used to transport `Money` values over the wire.
 *
 * Of the format `${currencyCode}:${amount}`. E.g. `USD:100.00000000`
 */
export type SerializedMoney<C extends CurrencyCode = CurrencyCode> =
  `${C}:${string}`;

/**
 * The `Money` type is used to represent a monetary value in a specific currency. It allows for safe arithmetic
 * with 8 decimal places of precision.
 *
 * Amounts are represented in their fractional unit.
 * E.g. USD is represented in dollars.
 *
 * Within the API codebase we should always represent monetary values using the `Money` type. The only
 * exception is when we are serializing/deserializing `Money` values to/from our database, GraphQL API, or a 3rd party API.
 *
 * The Money type is immutable. Calling any function on a Money object will not mutate the data, but instead return a new object.
 */
export class Money<C extends CurrencyCode = CurrencyCode> {
  private readonly currency: Currency<C>;

  public readonly currencyCode: C;

  protected readonly amount: BigNumber;

  /**
   * Stringified version of the amount with 8 decimal places of precision.
   */
  protected readonly internalValue: string;

  public constructor(amount: BigNumber | number | string, currencyCode: C) {
    const currency = currencyByCode[currencyCode];
    if (!currency) {
      throw new Error(`Invalid currency code: ${currencyCode}`);
    }

    this.currency = currency;
    this.currencyCode = currencyCode;
    this.amount = new BigNumber(amount);
    this.internalValue = this.format();

    if (this.amount.isNaN()) {
      throw new Error(`Invalid money amount: ${amount}`);
    }
  }

  /**
   * Re-hydrate a serialized Money object.
   *
   * ⚠️ WARNING: Do not manually build the input value for this function as a way to instantiate a Money object.
   * The only input value that should be provided is the output of `Money.serialize()`.
   */
  public static deserialize<C extends CurrencyCode>(
    value: SerializedMoney<C>,
  ): Money<C> {
    const [currencyCode, amount] = value.split(':');
    if (!amount) {
      throw new Error(`Invalid serialized money value: ${value}`);
    }

    // Note: We can safely cast currencyCode as C since the Money constructor will throw an error if the currency code is invalid.
    return new Money(amount, currencyCode as C);
  }

  public dividedBy(divisor: Money<C> | number | BigNumber): Money<C> {
    if (typeof divisor === 'number' || divisor instanceof BigNumber) {
      return new Money(this.amount.dividedBy(divisor), this.currency.code);
    }

    if (this.currency.code !== divisor.currency.code) {
      throw new Error(
        `Cannot divide Money amounts if not the same currency! ${this.currency.code} != ${divisor.currency.code}`,
      );
    }

    return new Money(this.amount.dividedBy(divisor.amount), this.currency.code);
  }

  public equals(other: Money<C>): boolean {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot compare Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return this.amount.isEqualTo(other.amount);
  }

  /**
   * Stringified version of the amount including the currency symbol
   * and the standard number of decimals for the currency.
   *
   * E.g.
   *
   *  $1,000.99
   *
   *  €1,000.99
   *
   *  ¥123,456 (0 decimal currency)
   *
   *  KWD 1,234.567 (3 decimal currency)
   *
   */
  public format(): string {
    const currencyFormatter = new Intl.NumberFormat('en', {
      currency: this.currency.code,
      notation: 'standard',
      style: 'currency',
    });

    return currencyFormatter.format(
      this.amount
        .decimalPlaces(this.currency.standardNumberOfDigits)
        .toNumber(),
    );
  }

  /**
   * Compact stringified version of the amount including the currency symbol
   * rounded to an easily readable number
   *
   * E.g.
   *
   *  $100.99 outputs $101
   *
   *  $1500.99 outputs $1.5K
   *
   *  $10,000.99 outputs $10K
   *
   *  €1500.99 outputs €1.5K
   *
   *  ¥123,456 outputs ¥123K (0 decimal currency)
   *
   *  KWD 1,234.567 outputs KWD 1.23K (3 decimal currency)
   */
  public formatCompact(): string {
    const currencyFormatter = new Intl.NumberFormat('en', {
      currency: this.currency.code,
      notation: 'compact',
      style: 'currency',
    });

    return currencyFormatter.format(
      this.amount
        .decimalPlaces(this.currency.standardNumberOfDigits)
        .toNumber(),
    );
  }

  /**
   * Stringified version of the amount including the currency symbol
   * and no decimals.
   *
   * E.g.
   *
   *  $1,000
   *
   *  €1,000
   *
   *  ¥123,456 (0 decimal currency)
   *
   *  KWD 1,234 (3 decimal currency)
   *
   */
  public formatRounded(): string {
    const currencyFormatter = new Intl.NumberFormat('en', {
      currency: this.currency.code,
      maximumFractionDigits: 0,
      notation: 'standard',
      style: 'currency',
    });

    return currencyFormatter.format(
      this.amount
        .decimalPlaces(this.currency.standardNumberOfDigits)
        .toNumber(),
    );
  }

  public isGreaterThan(other: Money<C>): boolean {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot compare Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return this.amount.isGreaterThan(other.amount);
  }

  public isGreaterThanOrEqualTo(other: Money<C>): boolean {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot compare Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return this.amount.isGreaterThanOrEqualTo(other.amount);
  }

  public isLessThan(other: Money<C>): boolean {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot compare Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return this.amount.isLessThan(other.amount);
  }

  public isPositive(): boolean {
    return this.amount.isGreaterThan(0);
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  public minus(other: Money<C>): Money<C> {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot minus Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return new Money(this.amount.minus(other.amount), this.currency.code);
  }

  public multipliedBy(multiplier: number | BigNumber): Money<C> {
    return new Money(this.amount.multipliedBy(multiplier), this.currency.code);
  }

  public plus(other: Money<C>): Money<C> {
    if (this.currency.code !== other.currency.code) {
      throw new Error(
        `Cannot plus Money amounts if not the same currency! ${this.currency.code} != ${other.currency.code}`,
      );
    }

    return new Money(this.amount.plus(other.amount), this.currency.code);
  }

  /**
   * Rounds the amount to the standard number of decimal places for the currency.
   *
   * Note: The underlying value will still have 8 decimal places of precision, but anything after the standard
   * number of decimal places will be trailing zeroes.
   *
   * E.g.
   *
   * `Money.fromDecimal(100.12999999, 'USD').round(2)`
   *
   *  is equal to
   *
   * `Money.fromUsdDollars(100.13000000)`
   *
   */
  public roundToStandardPrecision(): Money<C> {
    return new Money(
      this.amount.decimalPlaces(this.currency.standardNumberOfDigits),
      this.currency.code,
    );
  }

  /**
   * Serializes the Money object to a string that can later be deserialized using the `Money.deserialize` method.
   *
   * E.g.
   *
   * $100.99 outputs 'USD:100.99000000'
   *
   * $100.12345678 outputs 'USD:100.12345678'
   *
   * ¥123,456 outputs 'JPY:123456.00000000'
   */
  public serialize(): SerializedMoney<C> {
    return `${this.currency.code}:${this.toFullPrecision()}`;
  }

  /**
   * Stringified version of the amount with 8 decimal places of precision.
   *
   * E.g.
   *
   * $100.12345678 outputs '100.12345678'
   */
  public toFullPrecision(): string {
    return this.amount.toFixed(NUM_DECIMAL_PLACES);
  }

  /**
   * Converts the amount to a JavaScript Number. This is marked as unsafe because it can lead to loss of precision
   * with very large numbers.
   *
   * Note: This method should be used very rarely.
   *
   * E.g.
   *
   * $100.99 outputs 100.99
   *
   * $100.12345678 outputs 100.12345678
   */
  public toUnsafeNumber(): number {
    return this.amount.toNumber();
  }

  /**
   *
   * @param targetCurrencyCode The currency code to convert to
   * @param exchangeRateCurrentToTarget The exchange rate of converting the current currency to the `target` currency. E.g. If the current object is `Money<'USD'>` and the target currency is `'EUR'` then this should be the USD/EUR exchange rate.
   */
  public convertCurrency<TargetCurrency extends CurrencyCode>(
    targetCurrencyCode: TargetCurrency,
    exchangeRateCurrentToTarget: number | BigNumber,
  ): Money<TargetCurrency> {
    return new Money(
      this.amount.multipliedBy(exchangeRateCurrentToTarget),
      targetCurrencyCode,
    );
  }

  /**
   * Stringified version of the amount with the standard number of decimal places for the currency.
   * Rounding is done using "banker's rounding".
   *
   * E.g.
   *
   * $100.12345678 outputs '100.12'
   *
   * ¥123 outputs '123' (0 decimal currency)
   *
   * BWD 100.12345678 outputs '100.123' (3 decimal currency)
   */
  public toStandardPrecision() {
    return this.amount.toFixed(this.currency.standardNumberOfDigits);
  }

  /**
   *
   * Improves the output of `console.log` and `util.inspect` for Money objects
   * for debugging purposes.
   */
  private [Symbol.for('nodejs.util.inspect.custom')](_depth, options) {
    return `Money {
  amount: ${options.stylize("'" + this.toFullPrecision() + "'", 'string')},
  currencyCode: ${options.stylize("'" + this.currencyCode + "'", 'string')},
}`;
  }
}

/**
 * Shorthand to create a Money object.
 * @param amount
 * @param currencyCode
 */
export const money = (
  amount: BigNumber | number | string,
  currencyCode: CurrencyCode,
) => {
  return new Money(amount, currencyCode);
};

export const usd = (amount: BigNumber | number | string) => {
  return new Money(amount, 'USD');
};
