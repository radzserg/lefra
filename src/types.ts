export type OperationType = 'DEBIT' | 'CREDIT';

export type NonEmptyArray<T> = [T, ...T[]];

type FunctionNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type EXTERNAL_ID = string | number;
export type INTERNAL_ID = string;

export type OmitFunctions<T> = Omit<T, FunctionNames<T>>;
