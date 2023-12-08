import { BigNumber } from 'bignumber.js';

export type UnitCode = string;

export class Unit<C extends UnitCode> {
  private readonly amount: BigNumber;

  public constructor(
    amount: BigNumber | number | string,
    public readonly code: C,
    private readonly numberOfDigits: number,
  ) {
    this.amount = new BigNumber(amount);
    // this.internalValue = this.format();

    if (this.amount.isNaN()) {
      throw new Error(`Invalid money amount: ${amount}`);
    }

    if (this.amount.isLessThan(0)) {
      throw new Error(`Invalid unit amount: ${amount}. Must be positive.`);
    }
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
      notation: 'standard',
      style: 'number',
    });

    return currencyFormatter.format(
      this.amount.decimalPlaces(this.numberOfDigits).toNumber(),
    );
  }

  public equals(other: Unit<UnitCode>): boolean {
    if (!this.isSameCurrency(other)) {
      throw new Error(
        `Cannot compare Money amounts if not the same currency! ${this.code} != ${other.code}`,
      );
    }

    return this.amount.isEqualTo(other.amount);
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  public zeroValue(): Unit<C> {
    return new Unit(0, this.code, this.numberOfDigits);
  }

  public isSameCurrency(otherUnit: Unit<UnitCode>): otherUnit is Unit<C> {
    return this.code === otherUnit.code;
  }

  public isLessThan(other: Unit<C>): boolean {
    if (this.code !== other.code) {
      throw new Error(
        `Cannot compare Unit amounts if not the same currency! ${this.code} != ${other.code}`,
      );
    }

    return this.amount.isLessThan(other.amount);
  }

  public plus(other: Unit<UnitCode>): Unit<C> {
    if (!this.isSameCurrency(other)) {
      throw new Error(
        `Cannot plus Money amounts if not the same currency! ${this.code} != ${other.code}`,
      );
    }

    return new Unit(
      this.amount.plus(other.amount),
      this.code,
      this.numberOfDigits,
    );
  }
}

export const unit = <Code extends UnitCode>(
  amount: BigNumber | number | string,
  code: Code,
  numberOfDigits: number,
): Unit<Code> => {
  return new Unit(amount, code, numberOfDigits);
};
