import { Unit } from '@/ledger/units/Unit.js';
import { describe, expect, test } from 'vitest';

describe('unit', () => {
  test('can create USD unit', () => {
    const usd = new Unit(100, 'USD', 2);
    expect(usd.code).toBe('USD');
    expect(usd.format()).toBe('USD:100.00');
  });

  test('can sum USD unit', () => {
    const usd = new Unit(100, 'USD', 2);
    const result = usd.plus(new Unit(10.2, 'USD', 2));
    expect(result.format()).toBe('USD:110.20');
  });

  test('can sum USD with rounding', () => {
    const usd = new Unit(100, 'USD', 2);
    const result = usd.plus(new Unit(10.229, 'USD', 2));
    expect(result.format()).toBe('USD:110.23');
  });

  test('can create bonus points with zero fraction digits', () => {
    const bonusPoints = new Unit(100, 'BonusPoint', 0);
    expect(bonusPoints.code).toBe('BonusPoint');
    expect(bonusPoints.format()).toBe('BonusPoint:100');
  });

  test('can use different fraction digits for the same currency', () => {
    const bonusPoints = new Unit(100, 'BonusPoint', 0);
    expect(() => bonusPoints.minus(new Unit(10.229, 'BonusPoint', 2))).toThrow(
      'Cannot compare Unit amounts, operands have the same currency BonusPoint but different number of fraction digits.',
    );
  });

  test('can deduct bonus points with rounding', () => {
    const bonusPoints = new Unit(100, 'BonusPoint', 0);
    const result = bonusPoints.minus(new Unit(10.2, 'BonusPoint', 0));
    expect(result.format()).toBe('BonusPoint:90');
  });

  test('can not multiple different currencies', () => {
    const usd = new Unit(100, 'USD', 2);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(() => usd.multipliedBy(new Unit(10.2, 'EUR', 2))).toThrow(
      'Cannot compare Unit amounts if not the same currency! USD != EUR',
    );
  });
});
