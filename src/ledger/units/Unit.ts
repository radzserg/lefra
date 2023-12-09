import { BigNumber } from 'bignumber.js';

const NUM_DECIMAL_PLACES = 8;

// Follow "banker's rounding"
BigNumber.config({
  DECIMAL_PLACES: NUM_DECIMAL_PLACES,
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN,
});

export type UnitCode = string;
type OperationArgument<C extends UnitCode> = Unit<C> | number | BigNumber;

export class UnitError extends Error {}

export class DifferentCurrencyError extends UnitError {
  public constructor(code1: Unit<UnitCode>, code2: Unit<UnitCode>) {
    super(
      `Cannot compare Unit amounts if not the same currency! ${code1} != ${code2}`,
    );
  }
}

export class Unit<C extends UnitCode> {
  private readonly amount: BigNumber;

  /**
   * Stringified version of the amount including the currency symbol. Keep it for easier debugging.
   */
  private readonly internalValue: string;

  public constructor(
    amount: BigNumber | number | string,
    public readonly code: C,
    private readonly numberOfDigits: number,
  ) {
    this.amount = new BigNumber(amount);
    this.internalValue = this.format();

    if (this.amount.isNaN()) {
      throw new UnitError(`Invalid money amount: ${amount}`);
    }

    if (this.amount.isLessThan(0)) {
      throw new UnitError(`Invalid unit amount: ${amount}. Must be positive.`);
    }
  }

  public equals(other: Unit<UnitCode>): boolean {
    if (!this.isSameCurrency(other)) {
      throw new DifferentCurrencyError(this, other);
    }

    return this.amount.isEqualTo(other.amount);
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  public isPositive(): boolean {
    return this.amount.isGreaterThan(0);
  }

  public zeroValue(): Unit<C> {
    return new Unit(0, this.code, this.numberOfDigits);
  }

  public isSameCurrency(other: Unit<UnitCode>): other is Unit<C> {
    return this.code === other.code;
  }

  public isLessThan(argument: OperationArgument<C>): boolean {
    return this.amount.isLessThan(this.toUnit(argument).amount);
  }

  public isLessThanOrEqualTo(argument: OperationArgument<C>): boolean {
    return this.amount.isLessThanOrEqualTo(this.toUnit(argument).amount);
  }

  public isGreaterThan(argument: OperationArgument<C>): boolean {
    return this.amount.isGreaterThan(this.toUnit(argument).amount);
  }

  public isGreaterThanOrEqualTo(argument: OperationArgument<C>): boolean {
    return this.amount.isGreaterThanOrEqualTo(this.toUnit(argument).amount);
  }

  public plus(argument: OperationArgument<C>): Unit<C> {
    return new Unit(
      this.amount.plus(this.toUnit(argument).amount),
      this.code,
      this.numberOfDigits,
    );
  }

  public minus(argument: OperationArgument<C>): Unit<C> {
    return new Unit(
      this.amount.minus(this.toUnit(argument).amount),
      this.code,
      this.numberOfDigits,
    );
  }

  public dividedBy(argument: OperationArgument<C>): Unit<C> {
    return new Unit(
      this.amount.dividedBy(this.toUnit(argument).amount),
      this.code,
      this.numberOfDigits,
    );
  }

  public multipliedBy(argument: OperationArgument<C>): Unit<C> {
    return new Unit(
      this.amount.multipliedBy(this.toUnit(argument).amount),
      this.code,
      this.numberOfDigits,
    );
  }

  /**
   * Stringified version of the amount with 8 decimal places of precision.
   */
  public toFullPrecision(): string {
    return this.amount.toFixed(NUM_DECIMAL_PLACES);
  }

  /**
   * Stringified version of the amount including the currency symbol
   * and the standard number of decimals for the currency.
   *
   * E.g.
   *
   *  USD:1000.99
   *
   */
  public format(): string {
    const currencyFormatter = new Intl.NumberFormat('en', {
      minimumFractionDigits: this.numberOfDigits,
    });

    const value = currencyFormatter.format(
      this.amount.decimalPlaces(this.numberOfDigits).toNumber(),
    );
    return `${this.code}:${value}`;
  }

  /**
   *
   * Improves the output of `console.log` and `util.inspect` for Money objects
   * for debugging purposes.
   */
  private [Symbol.for('nodejs.util.inspect.custom')](_depth, options) {
    return `Unit {
  amount: ${options.stylize("'" + this.toFullPrecision() + "'", 'string')},
  currencyCode: ${options.stylize("'" + this.code + "'", 'string')},
}`;
  }

  private toUnit(value: OperationArgument<C>): Unit<C> {
    if (typeof value === 'number' || value instanceof BigNumber) {
      return new Unit<C>(
        this.amount.dividedBy(value),
        this.code,
        this.numberOfDigits,
      );
    }

    if (this.code !== value.code) {
      throw new DifferentCurrencyError(this, value);
    }

    return value;
  }
}

export const unit = <Code extends UnitCode>(
  amount: BigNumber | number | string,
  code: Code,
  numberOfDigits: number,
): Unit<Code> => {
  return new Unit(amount, code, numberOfDigits);
};
