import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import * as fs from 'node:fs';

type SaveMode =
  | {
      mode: 'file';
      path: string;
    }
  | {
      mode: 'output';
    };
type GenerateCustomLedgerSpecOptions = {
  className: string;
  ledgerSlug: string;
} & SaveMode;

export class CustomLedgerSpecGenerator {
  public constructor(private readonly storage: LedgerStorage) {}

  public async generate({
    className,
    ledgerSlug,
    ...props
  }: GenerateCustomLedgerSpecOptions): Promise<string | null> {
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

    const spec = `export const ${className} = {
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
    if (props.mode === 'file') {
      fs.writeFileSync(props.path, spec);
      return null;
    } else {
      return spec;
    }
  }
}
