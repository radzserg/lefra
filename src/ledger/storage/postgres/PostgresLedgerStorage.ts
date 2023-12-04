import { LedgerNotFoundError } from '@/errors.js';
import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { CurrencyCode } from '@/money/currencies.js';
import { Money } from '@/money/Money.js';
import { currencyCodeSchema } from '@/money/validation.js';
import {
  DB_ID,
  InputLedgerAccount,
  InputLedgerAccountType,
  LedgerInput,
  PersistedEntry,
  PersistedLedgerAccount,
  PersistedLedgerAccountType,
  PersistedTransaction,
} from '@/types.js';
import { DatabaseConnection, sql } from 'slonik';
import { z } from 'zod';

export class PostgresLedgerStorage implements LedgerStorage {
  public constructor(private readonly connection: DatabaseConnection) {}

  public async findAccountTypeBySlug(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    slug: string,
  ): Promise<PersistedLedgerAccountType | null> {
    throw new Error('Method not implemented.');
  }

  public async getTransactionById(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transactionId: DB_ID,
  ): Promise<PersistedTransaction> {
    throw new Error('Method not implemented.');
  }

  public async getTransactionEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transactionId: DB_ID,
  ): Promise<PersistedEntry[]> {
    throw new Error('Method not implemented.');
  }

  public async getLedgerAccount({ slug }: { slug: string }): Promise<number> {
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

  public async insertLedger(input: LedgerInput) {
    const { currencyCode, description, name, slug } = input;
    const ledgerId = await this.connection.oneFirst(
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
    return {
      ...input,
      id: ledgerId,
    };
  }

  public async insertAccountType({
    description,
    isEntityLedgerAccount,
    ledgerId,
    name,
    normalBalance,
    parentLedgerAccountTypeId = null,
    slug,
  }: InputLedgerAccountType): Promise<PersistedLedgerAccountType> {
    const ledgerAccountTypeId = await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger_account_type (       
          slug, 
          name, 
          description, 
          normal_balance, 
          is_entity_ledger_account, 
          parent_ledger_account_type_id
        ) 
        VALUES (
          ${slug}, 
          ${name}, 
          ${normalBalance}, 
          ${description}, 
          ${isEntityLedgerAccount}, 
          ${parentLedgerAccountTypeId}
        )
        RETURNING id
      `,
    );
    return {
      description,
      id: ledgerAccountTypeId,
      isEntityLedgerAccount,
      ledgerId,
      name,
      normalBalance,
      parentLedgerAccountTypeId,
      slug,
    };
  }

  public async fetchAccountBalance(
    account: LedgerAccountRef,
  ): Promise<Money | null> {
    const id = await this.getLedgerAccountId(account);
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
    const currencyCode = await this.getLedgerCurrencyCode(account.ledgerSlug);

    return new Money(amount, currencyCode);
  }

  public async insertTransaction(transaction: Transaction) {
    throw new Error(`Method not implemented. ${transaction}`);

    return {
      ...transaction,
      id: '1',
    };
  }

  private async getLedgerAccountId(account: LedgerAccountRef): Promise<number> {
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
          la.slug = ${account.accountSlug}
          AND la.ledger_id = ${account.accountSlug}
      `,
    );
    if (!ledgerAccount) {
      throw new LedgerNotFoundError(
        `Ledger account ${account.accountSlug} is not found`,
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

  public async findAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    account: LedgerAccountRef,
  ): Promise<PersistedLedgerAccount | null> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getLedgerIdBySlug(slug: string): Promise<DB_ID> {
    throw new Error('Method not implemented.');
  }

  public async upsertAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parameters: InputLedgerAccount,
  ): Promise<PersistedLedgerAccount> {
    throw new Error('Method not implemented.');
  }
}
