import { Renderer } from '@/ledger/renderer/Renderer.js';
import { Entry } from '@/ledger/transaction/Entry.js';
import { EntryAction } from '@/types.js';

export class EntriesRenderer implements Renderer {
  public render(entries: Entry[]): string {
    const lines: string[] = [];
    for (const entry of entries) {
      lines.push(this.formatEntry(entry));
    }

    return lines.join('\n');
  }

  private formatEntry(entry: Entry): string {
    return `${this.formatOperation(entry.action)} ${entry.amount.format()} ${
      entry.account.accountSlug
    }`;
  }

  private formatOperation(entityAction: EntryAction): string {
    return entityAction.padEnd(6, ' ');
  }
}
