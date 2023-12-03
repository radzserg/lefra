import { Renderer } from '@/ledger/renderer/Renderer.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Money } from '@/money/Money.js';

type RenderSettings = {
  maxAccountBalanceLength: number;
  maxAccountNameLength: number;
  maxAmountLength: number;
};

type AccountBalances = {
  [account: string]: Money;
};

const SEPARATOR = '    ';
const SPACE = ' ';

export class TransactionFlowRenderer implements Renderer {
  public render(transaction: Transaction): string {
    const transactionDoubleEntries = transaction.transactionDoubleEntries;
    const doubleEntries = transactionDoubleEntries.entries;

    const { maxAccountBalanceLength, maxAccountNameLength, maxAmountLength } =
      this.defineRenderSettings(transaction);

    const lines: string[] = [];
    lines.push(
      'Account'.padEnd(maxAccountNameLength + 1, SPACE) +
        SEPARATOR +
        'DEBIT'.padStart(maxAmountLength, SPACE) +
        SEPARATOR +
        'CREDIT'.padStart(maxAmountLength, SPACE) +
        SEPARATOR +
        'BALANCE'.padStart(maxAccountBalanceLength, SPACE),
    );

    let accountsBalances: AccountBalances = {};
    for (const doubleEntry of doubleEntries) {
      for (let index = 0; index < doubleEntry.debitEntries.length; index++) {
        const debitEntry = doubleEntry.debitEntries[index];
        accountsBalances = this.trackAccountBalance(
          accountsBalances,
          debitEntry,
        );
        const comment = index === 0 ? doubleEntry.comment : '';
        lines.push(
          debitEntry.account.slug.padEnd(maxAccountNameLength + 1, SPACE) +
            SEPARATOR +
            debitEntry.amount.format().padStart(maxAmountLength, SPACE) +
            SEPARATOR +
            ''.padStart(maxAmountLength, SPACE) +
            SEPARATOR +
            accountsBalances[debitEntry.account.slug].format() +
            SEPARATOR +
            comment,
        );
      }

      for (const creditEntry of doubleEntry.creditEntries) {
        accountsBalances = this.trackAccountBalance(
          accountsBalances,
          creditEntry,
        );
        lines.push(
          creditEntry.account.slug.padEnd(maxAccountNameLength + 1, SPACE) +
            SEPARATOR +
            ''.padEnd(maxAmountLength, SPACE) +
            SEPARATOR +
            creditEntry.amount.format().padStart(maxAmountLength, SPACE) +
            SEPARATOR +
            accountsBalances[creditEntry.account.slug].format(),
        );
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  private defineRenderSettings(transaction: Transaction): RenderSettings {
    const entries = transaction.transactionDoubleEntries.flatEntries();
    let maxAccountNameLength = 0;
    let maxAmountLength = 'CREDIT'.length;
    let maxAccountBalanceLength = 0;

    let accountsBalances: AccountBalances = {};
    for (const entry of entries) {
      accountsBalances = this.trackAccountBalance(accountsBalances, entry);

      const accountNameLength = entry.account.slug.length;
      if (accountNameLength > maxAccountNameLength) {
        maxAccountNameLength = accountNameLength;
      }

      const amountLength = entry.amount.format().length;
      if (amountLength > maxAmountLength) {
        maxAmountLength = amountLength;
      }
    }

    for (const accountBalance of Object.values(accountsBalances)) {
      const accountBalanceLength = accountBalance.format().length;
      if (accountBalanceLength > maxAccountBalanceLength) {
        maxAccountBalanceLength = accountBalanceLength;
      }
    }

    return {
      maxAccountBalanceLength,
      maxAccountNameLength,
      maxAmountLength,
    };
  }

  private trackAccountBalance(accountsBalances: AccountBalances, entry: Entry) {
    const accountSlug = entry.account.slug;
    if (accountsBalances[accountSlug]) {
      if (entry.action === 'DEBIT') {
        accountsBalances[accountSlug] = accountsBalances[accountSlug].plus(
          entry.amount,
        );
      } else if (entry.action === 'CREDIT') {
        accountsBalances[accountSlug] = accountsBalances[accountSlug].minus(
          entry.amount,
        );
      }
    } else {
      accountsBalances[accountSlug] = entry.amount;
    }

    return accountsBalances;
  }
}
