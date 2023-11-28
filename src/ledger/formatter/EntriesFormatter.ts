import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { UserLedgerAccount } from '@/ledger/accounts/UserLedgerAccount.js';
import { Entry } from '@/ledger/records/Entry.js';
import { OperationType } from '@/types.js';

export class EntriesFormatter {
  public format(entries: Entry[]): string {
    const lines: string[] = [];
    for (const entry of entries) {
      lines.push(this.formatEntry(entry));
    }

    return lines.join('\n');
  }

  private formatEntry(entry: Entry): string {
    return `${this.formatOperation(
      entry.type,
    )} ${entry.amount.formatCompact()} ${this.formatAccount(entry.account)}`;
  }

  private formatAccount(account: LedgerAccount): string {
    if (account instanceof SystemLedgerAccount) {
      return `SYSTEM_${account.name}`;
    } else if (account instanceof UserLedgerAccount) {
      return `USER_${account.name}_${account.userAccountId}`;
    } else {
      throw new TypeError(`Unknown account type: ${account}`);
    }
  }

  private formatOperation(operation: OperationType): string {
    switch (operation) {
      case 'CREDIT':
        return 'CREDIT';
      case 'DEBIT':
        return 'DEBIT ';
      default:
        throw new TypeError(`Unknown operation type: ${operation}`);
    }
  }
}
