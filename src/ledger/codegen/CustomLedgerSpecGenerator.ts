import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';

type GenerateCustomLedgerSpecOptions = {
  ledgerSlug: string;
};

export class CustomLedgerSpecGenerator {
  public constructor(private readonly storage: LedgerStorage) {}

  public async generate({ ledgerSlug }: GenerateCustomLedgerSpecOptions) {
    const ledgerId = await this.storage.getLedgerIdBySlug(ledgerSlug);
    const currency = await this.storage.getLedgerCurrency(ledgerId);

    const systemAccounts = await this.storage.findSystemAccounts(ledgerId);
    const entityAccountTypes =
      await this.storage.findEntityAccountTypes(ledgerId);

    console.log('currency', currency);
    console.log('systemAccounts', systemAccounts);
    console.log('entityAccountTypes', entityAccountTypes);
  }
}
