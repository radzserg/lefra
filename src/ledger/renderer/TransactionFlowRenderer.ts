import { Renderer } from '@/ledger/renderer/Renderer.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';

export class TransactionFlowRenderer implements Renderer {
  public render(transaction: Transaction): string {
    const transactionDoubleEntries = transaction.transactionDoubleEntries;
    const doubleEntries = transactionDoubleEntries.entries;

    const lines: string[] = [];
    for (const doubleEntry of doubleEntries) {
      const line = doubleEntry.comment ?? '';

      lines.push(line);
    }

    return lines.join('\n');
  }
}
