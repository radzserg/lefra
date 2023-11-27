export type OperationType = 'DEBIT' | 'CREDIT';

export type NonEmptyArray<T> = [T, ...T[]];

type FunctionNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type OmitFunctions<T> = Omit<T, FunctionNames<T>>;
