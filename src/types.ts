export type EntryAction = 'DEBIT' | 'CREDIT';

export type NonEmptyArray<T> = [T, ...T[]];

export type DB_ID = string | number;

export type ArrayType<T> = T extends Array<infer U> ? U : never;
