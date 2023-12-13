import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';

type GenerateCustomLedgerSpecOptions = {
  className: string;
  ledgerSlug: string;
};

export class CustomLedgerSpecGenerator {
  public constructor(private readonly storage: LedgerStorage) {}

  public async generate({
    className,
    ledgerSlug,
  }: GenerateCustomLedgerSpecOptions) {
    const { id: ledgerId, slug } =
      await this.storage.getLedgerIdBySlug(ledgerSlug);
    const currency = await this.storage.getLedgerCurrency(ledgerId);

    const systemAccounts = await this.storage.findSystemAccounts(ledgerId);
    const entityAccountTypes =
      await this.storage.findEntityAccountTypes(ledgerId);

    const entityAccountTypesString = entityAccountTypes
      .map((entityAccountType) => `    '${entityAccountType.slug}'`)
      .join(',\n');

    const systemAccountsString = systemAccounts
      .map((systemAccount) => `    '${systemAccount.slug}'`)
      .join(',\n');

    const spec = `
export const ${className} = {
  currencyCode: '${currency.currencyCode}',
  entityAccountTypes: [
${entityAccountTypesString}
  ] as const,
  slug: '${slug}',
  systemAccounts: [
${systemAccountsString}
  ] as const,
};
`;
    return spec;
  }
}
