import { NonEmptyArray } from '@/types.js';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-explicit-any
export const isNonEmptyArray = <T extends any>(
  value: T[],
): value is NonEmptyArray<T> => {
  return Array.isArray(value) && value.length > 0;
};
