import { EntriesRenderer } from '@/ledger/renderer/EntriesRenderer.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Money } from '@/money/Money.js';
import { expect } from 'vitest';

type ExpectedEntry = ['DEBIT' | 'CREDIT', string, Money];

type ExpectedTransaction = {
  description?: string;
  entries: ExpectedEntry[];
};

const transformToReadableEntry = (entry: ExpectedEntry) => {
  return `${entry[0].padEnd(6, ' ')} ${entry[2].format()} ${entry[1]} `;
};

const transformToReadableEntries = (entries: ExpectedEntry[]) => {
  return entries.map(transformToReadableEntry).join('\n');
};

export const assertTransaction = async (
  transaction: Transaction,
  {
    description: expectedDescription,
    entries: expectedEntries,
  }: ExpectedTransaction,
) => {
  expect(transaction).not.toBeNull();
  if (expectedDescription) {
    expect(transaction.description).toEqual(expectedDescription);
  }

  const entriesRenderer = new EntriesRenderer();
  if (transaction.entries.length !== expectedEntries.length) {
    throw new Error(
      `Expected ledger entries !== Actual.\n` +
        `Expected:\n${transformToReadableEntries(expectedEntries)}\n` +
        `Actual:\n${entriesRenderer.render(transaction.entries)}\n`,
    );
  }

  const actualEntries = transaction.entries;
  for (const [index, expectedEntry] of expectedEntries.entries()) {
    const actualEntry: Entry = actualEntries[index];

    if (
      actualEntry.action !== expectedEntry[0] ||
      actualEntry.account.accountSlug !== expectedEntry[1] ||
      !actualEntry.amount.equals(expectedEntry[2])
    ) {
      throw new Error(
        `Expected ledger entries !== Actual.\n` +
          `Equal:\n${transformToReadableEntries(
            expectedEntries.slice(0, index),
          )}\n\n` +
          `Expected:\n${transformToReadableEntries(
            expectedEntries.slice(index),
          )}\n\n` +
          `Actual:\n${entriesRenderer.render(
            transaction.entries.slice(index),
          )}\n`,
      );
    }
  }
};
