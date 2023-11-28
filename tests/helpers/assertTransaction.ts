import { EntriesFormatter } from '@/ledger/formatter/EntriesFormatter.js';
import { Transaction } from '@/ledger/records/Transaction.js';
import { Money } from '@/money/Money.js';
import { expect } from 'vitest';

type ExpectedEntry = ['DEBIT' | 'CREDIT', string, Money];

type ExpectedTransaction = {
  description?: string;
  entries: ExpectedEntry[];
};

const transformToReadableEntry = (entry: ExpectedEntry) => {
  return `${entry[0]} ${entry[1]} ${entry[2].formatCompact()}`;
};

const transformToReadableEntries = (entries: ExpectedEntry[]) => {
  return entries.map(transformToReadableEntry).join('\n');
};

export const assertTransaction = (
  transaction: Transaction,
  { description, entries }: ExpectedTransaction,
) => {
  expect(transaction).not.toBeNull();
  if (description) {
    expect(transaction.description).toEqual(description);
  }

  const formatter = new EntriesFormatter();
  if (transaction.entries.length !== entries.length) {
    throw new Error(
      `Expected ledger entries !== Actual.\n` +
        `Expected:\n${transformToReadableEntries(entries)}\n` +
        `Actual:\n${formatter.format(transaction.entries)}\n`,
    );
  }

  for (const [index, expectedEntry] of entries.entries()) {
    const actualEntry = transaction.entries[index];

    expect(actualEntry.action).toEqual(expectedEntry[0]);
    expect(actualEntry.account.uniqueNamedIdentifier).toEqual(expectedEntry[1]);
    expect(actualEntry.amount).toEqual(expectedEntry[2]);
  }
};
