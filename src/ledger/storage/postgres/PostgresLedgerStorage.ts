import { LedgerNotFoundError } from '@/errors.js';
import { LedgerAccount } from '@/ledger/accounts/LedgerAccount.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { CurrencyCode } from '@/money/currencies.js';
import { Money } from '@/money/Money.js';
import { currencyCodeSchema } from '@/money/validation.js';
import { DB_ID } from '@/types.js';
import { DatabaseConnection, sql } from 'slonik';
import { z } from 'zod';

type IPostgresLedgerStorage = {
  getLedgerId: (parameters: { slug: string }) => Promise<number>;
  insertLedger: (parameters: {
    currencyCode: string;
    description: string;
    name: string;
    slug: string;
  }) => Promise<number>;

  insertLedgerAccountType: (parameters: {
    isEntityLedgerAccount: boolean;
    ledgerId: number;
    name: string;
    normalBalance: 'CREDIT' | 'DEBIT';
    parentLedgerAccountTypeId?: number | null;
    slug: string;
  }) => Promise<number>;
};

export class PostgresLedgerStorage
  implements LedgerStorage, IPostgresLedgerStorage
{
  public constructor(private readonly connection: DatabaseConnection) {}

  public async getLedgerId({ slug }: { slug: string }): Promise<number> {
    const ledger = await this.connection.maybeOne(
      sql.type(
        z
          .object({
            id: z.number(),
          })
          .strict(),
      )`
        SELECT 
          l.id
        FROM ledger l        
        WHERE
          l.slug = ${slug}
      `,
    );
    if (!ledger) {
      throw new LedgerNotFoundError(`Ledger ${slug} is not found`);
    }

    return ledger.id;
  }

  public async insertLedger({
    currencyCode,
    description,
    name,
    slug,
  }: {
    currencyCode: string;
    description: string;
    name: string;
    slug: string;
  }) {
    return await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger (slug, name, description, currency_code)
        VALUES (${slug}, ${name}, ${description}, ${currencyCode})
        RETURNING id
      `,
    );
  }

  public async insertLedgerAccountType({
    isEntityLedgerAccount,
    ledgerId,
    name,
    normalBalance,
    parentLedgerAccountTypeId = null,
    slug,
  }: {
    isEntityLedgerAccount: boolean;
    ledgerId: number;
    name: string;
    normalBalance: 'CREDIT' | 'DEBIT';
    parentLedgerAccountTypeId?: number | null;
    slug: string;
  }): Promise<number> {
    return await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger_account_type (ledger_id, slug, name, normal_balance, is_entity_ledger_account, parent_ledger_account_type_id) 
        VALUES (${ledgerId}, ${slug}, ${name}, ${normalBalance}, ${isEntityLedgerAccount}, ${parentLedgerAccountTypeId})
        RETURNING id
      `,
    );
  }

  public async fetchAccountBalance(
    ledgerId: DB_ID,
    account: LedgerAccount,
  ): Promise<Money | null> {
    const id = await this.getLedgerAccountId(ledgerId, account);
    const { amount } = await this.connection.one(
      sql.type(
        z
          .object({
            amount: z.string(),
          })
          .strict(),
      )`
        SELECT calculate_balance_for_ledger_account(${id}) amount;
      `,
    );
    const currencyCode = await this.getLedgerCurrencyCode(ledgerId);

    return new Money(amount, currencyCode);
  }

  public async insertTransaction() /*
    ledgerId: DB_ID,
    transaction: Transaction,
    
     */
  : Promise<void> {}

  private async getLedgerAccountId(
    ledgerId: DB_ID,
    account: LedgerAccount,
  ): Promise<number> {
    const ledgerAccount = await this.connection.maybeOne(
      sql.type(
        z
          .object({
            id: z.number(),
          })
          .strict(),
      )`
        SELECT 
          la.id
        FROM ledger_account la        
        WHERE
          la.slug = ${account.slug}
          AND la.ledger_id = ${ledgerId}
      `,
    );
    if (!ledgerAccount) {
      throw new LedgerNotFoundError(
        `Ledger account ${account.slug} is not found`,
      );
    }

    return ledgerAccount.id;
  }

  private async getLedgerCurrencyCode(ledgerId: DB_ID): Promise<CurrencyCode> {
    const ledger = await this.connection.maybeOne(
      sql.type(
        z
          .object({
            currencyCode: currencyCodeSchema,
          })
          .strict(),
      )`
        SELECT 
          l.currency_code
        FROM ledger l        
        WHERE
          l.id = ${ledgerId}
      `,
    );
    if (!ledger) {
      throw new LedgerNotFoundError(`Ledger ${ledgerId} is not found`);
    }

    return ledger.currencyCode;
  }
}
