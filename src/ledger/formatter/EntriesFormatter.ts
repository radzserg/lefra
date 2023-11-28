import { EntityLedgerAccount } from '@/ledger/accounts/EntityLedgerAccount.js';
import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { SystemLedgerAccount } from '@/ledger/accounts/SystemLedgerAccount.js';
import { Entry } from '@/ledger/records/Entry.js';
import { EntryAction } from '@/types.js';

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
      entry.action,
    )} ${entry.amount.formatCompact()} ${this.formatAccount(entry.account)}`;
  }

  private formatAccount(account: LedgerAccount): string {
    if (account instanceof SystemLedgerAccount) {
      return `${account.name}`;
    } else if (account instanceof EntityLedgerAccount) {
      return `${account.name}:${account.entityId}`;
    } else {
      throw new TypeError(`Unknown account type: ${account}`);
    }
  }

  private formatOperation(operation: EntryAction): string {
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
