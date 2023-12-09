import { LedgerError, LedgerNotFoundError } from '@/errors.js';
import { EntityAccountRef } from '@/ledger/accounts/EntityAccountRef.js';
import { LedgerAccountRef } from '@/ledger/accounts/LedgerAccountRef.js';
import { SystemAccountRef } from '@/ledger/accounts/SystemAccountRef.js';
import { LedgerStorage } from '@/ledger/storage/LedgerStorage.js';
import { databaseIdSchema } from '@/ledger/storage/validation.js';
import { Transaction } from '@/ledger/transaction/Transaction.js';
import { Unit, UnitCode } from '@/ledger/units/Unit.js';
import { unitSchema } from '@/ledger/units/validation.js';
import {
  DB_ID,
  InputLedgerAccount,
  InputLedgerAccountType,
  InputLedgerCurrency,
  LedgerInput,
  PersistedEntry,
  PersistedLedgerAccount,
  PersistedLedgerAccountType,
  PersistedTransaction,
} from '@/types.js';
import { DatabaseConnection, sql } from 'slonik';
import { z } from 'zod';

const LedgerAccountTypeShape = z
  .object({
    description: z.string(),
    id: databaseIdSchema,
    isEntityLedgerAccount: z.boolean(),
    name: z.string(),
    normalBalance: z.enum(['DEBIT', 'CREDIT']),
    parentLedgerAccountTypeId: databaseIdSchema.nullable(),
    slug: z.string(),
  })
  .strict();

const LedgerAccountShape = z
  .object({
    description: z.string().nullable(),
    id: databaseIdSchema,
    ledgerAccountTypeId: databaseIdSchema,
    ledgerId: databaseIdSchema,
    slug: z.string(),
  })
  .strict();

const LedgerTransactionShape = z
  .object({
    description: z.string().nullable(),
    id: databaseIdSchema,
    ledgerId: databaseIdSchema,
    postedAt: z.date(),
  })
  .strict();

const LedgerTransactionEntryShape = z
  .object({
    action: z.enum(['DEBIT', 'CREDIT']),
    amount: z.bigint(),
    id: databaseIdSchema,
    ledgerAccountId: databaseIdSchema,
    ledgerTransactionId: databaseIdSchema,
  })
  .strict();

export class PostgresLedgerStorage implements LedgerStorage {
  public constructor(private readonly connection: DatabaseConnection) {}

  public async findAccountTypeBySlug(
    slug: string,
  ): Promise<PersistedLedgerAccountType | null> {
    return await this.connection.maybeOne(sql.type(LedgerAccountTypeShape)`
      SELECT
        id,
        slug,
        name,
        description,
        normal_balance,
        is_entity_ledger_account,
        parent_ledger_account_type_id
      FROM ledger_account_type lat  
      WHERE
        lat.slug = ${slug}
    `);
  }

  public async getTransactionById(
    transactionId: DB_ID,
  ): Promise<PersistedTransaction> {
    const transaction = await this.connection.maybeOne(sql.type(
      LedgerTransactionShape,
    )`
      SELECT
        id,
        ledger_id,
        posted_at,
        description
      FROM ledger_transaction lt  
      WHERE
        lt.id = ${transactionId}
    `);

    if (!transaction) {
      throw new LedgerNotFoundError(`Transaction ${transactionId} not found`);
    }

    return transaction;
  }

  public async getTransactionEntries(
    transactionId: DB_ID,
  ): Promise<readonly PersistedEntry[]> {
    const transaction = await this.getTransactionById(transactionId);
    const entries = await this.connection.any(
      sql.type(LedgerTransactionEntryShape)`
        SELECT
          lte.id,
          lte.ledger_transaction_id,
          lte.ledger_account_id,
          lte.action,
          lte.amount
        FROM ledger_transaction_entry lte        
        WHERE
          lte.ledger_transaction_id = ${transactionId}
      `,
    );

    const currency = await this.getLedgerCurrency(transaction.ledgerId);

    return entries.map((entry) => {
      return {
        ...entry,
        amount: new Unit(
          entry.amount.toString(),
          currency.currencyCode,
          currency.minimumFractionDigits,
        ),
      };
    });
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

  public async insertCurrency(parameters: InputLedgerCurrency) {
    const { code, minimumFractionDigits, symbol } = parameters;
    const currencyId = await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger_currency (code, minimum_fraction_digits, symbol)
        VALUES (${code}, ${minimumFractionDigits}, ${symbol})
        RETURNING id
      `,
    );
    return {
      ...parameters,
      id: currencyId,
    };
  }

  public async insertLedger(input: LedgerInput) {
    const { description, ledgerCurrencyId, name, slug } = input;
    const ledgerId = await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger (slug, name, description, ledger_currency_id)
        VALUES (${slug}, ${name}, ${description}, ${ledgerCurrencyId})
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
    name,
    normalBalance,
    parentLedgerAccountTypeId = null,
    slug,
  }: InputLedgerAccountType): Promise<PersistedLedgerAccountType> {
    const existingAccount = await this.findAccountTypeBySlug(slug);
    if (existingAccount && !existingAccount.isEntityLedgerAccount) {
      throw new LedgerError(`Account type ${slug} already exists.`);
    }

    if (parentLedgerAccountTypeId) {
      const parentAccount = await this.getSavedAccountTypeById(
        parentLedgerAccountTypeId,
      );
      if (!parentAccount) {
        throw new LedgerError('Parent account type not found');
      }

      if (parentAccount.normalBalance !== normalBalance) {
        throw new LedgerError(
          'Parent account type must have the same normal balance',
        );
      }
    }

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
          ${description},
          ${normalBalance},           
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
      name,
      normalBalance,
      parentLedgerAccountTypeId,
      slug,
    };
  }

  public async fetchAccountBalance(
    account: LedgerAccountRef,
  ): Promise<Unit<UnitCode> | null> {
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
    const ledgerId = await this.getLedgerIdBySlug(account.ledgerSlug);
    const currency = await this.getLedgerCurrency(ledgerId);

    return new Unit(
      amount,
      currency.currencyCode,
      currency.minimumFractionDigits,
    );
  }

  private async getLedgerAccountId(account: LedgerAccountRef): Promise<number> {
    const ledgerId = await this.getLedgerIdBySlug(account.ledgerSlug);
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
          AND la.ledger_id = ${ledgerId}
      `,
    );
    if (!ledgerAccount) {
      throw new LedgerNotFoundError(`Account ${account.accountSlug} not found`);
    }

    return ledgerAccount.id;
  }

  private async getLedgerCurrency(
    ledgerId: DB_ID,
  ): Promise<{ currencyCode: UnitCode; minimumFractionDigits: number }> {
    const ledger = await this.connection.maybeOne(
      sql.type(
        z
          .object({
            currencyCode: unitSchema,
            minimumFractionDigits: z.number(),
          })
          .strict(),
      )`
        SELECT
          lc.code currency_code,
          lc.minimum_fraction_digits
        FROM ledger l        
        INNER JOIN ledger_currency lc ON lc.id = l.ledger_currency_id
        WHERE
          l.id = ${ledgerId}
      `,
    );
    if (!ledger) {
      throw new LedgerNotFoundError(`Ledger ${ledgerId} is not found`);
    }

    return {
      currencyCode: ledger.currencyCode,
      minimumFractionDigits: ledger.minimumFractionDigits,
    };
  }

  public async findAccount(
    account: LedgerAccountRef,
  ): Promise<PersistedLedgerAccount | null> {
    return await this.connection.maybeOne(
      sql.type(LedgerAccountShape)`
        SELECT 
          la.id,
          la.ledger_id,
          la.ledger_account_type_id,
          la.slug,
          la.description
        FROM ledger_account la        
        WHERE
          la.slug = ${account.accountSlug}
          AND la.ledger_id = (
            SELECT 
              l.id
            FROM ledger l
            WHERE
              l.slug = ${account.ledgerSlug}
        )
      `,
    );
  }

  public async getLedgerIdBySlug(slug: string): Promise<DB_ID> {
    const ledger = await this.connection.maybeOne(
      sql.type(
        z
          .object({
            id: databaseIdSchema,
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

  public async upsertAccount({
    description,
    ledgerAccountTypeId,
    ledgerId,
    slug,
  }: InputLedgerAccount): Promise<PersistedLedgerAccount> {
    const existingAccount = await this.findSavedAccount(ledgerId, slug);
    if (existingAccount) {
      return existingAccount;
    }

    const accountType = await this.getSavedAccountTypeById(ledgerAccountTypeId);

    const ledgerAccountId = await this.connection.oneFirst(
      sql.type(
        z.object({
          id: z.number(),
        }),
      )`
        INSERT INTO ledger_account (                 
          description, 
          ledger_account_type_id, 
          ledger_id, 
          slug
        ) 
        VALUES (
          ${description}, 
          ${accountType.id},
          ${ledgerId},
          ${slug}
        )
        RETURNING id
      `,
    );
    return {
      description,
      id: ledgerAccountId,
      ledgerAccountTypeId,
      ledgerId,
      slug,
    };
  }

  public async insertTransaction(
    ledgerTransaction: Transaction,
  ): Promise<PersistedTransaction> {
    const ledgerId = await this.getLedgerIdBySlug(ledgerTransaction.ledgerSlug);
    const postedAt = ledgerTransaction.postedAt ?? new Date();

    return await this.connection.transaction(async (transaction) => {
      const ledgerTransactionId = await transaction.oneFirst(
        sql.type(
          z.object({
            id: databaseIdSchema,
          }),
        )`
          INSERT INTO ledger_transaction (ledger_id, posted_at, description)
          VALUES (${ledgerId}, ${postedAt.toISOString()}, ${
            ledgerTransaction.description
          })
          RETURNING id
        `,
      );

      const rowsToInsert = ledgerTransaction.transactionDoubleEntries
        .flatEntries()
        .map((entry) => {
          const { account, action, amount } = entry;

          if (account instanceof SystemAccountRef) {
            return [
              ledgerTransactionId,
              sql.unsafe`ledger_account_id(${ledgerId}, ${account.accountSlug})`,
              action,
              amount.toFullPrecision(),
            ];
          } else if (account instanceof EntityAccountRef) {
            return [
              ledgerTransactionId,
              sql.unsafe`ledger_account_id(${ledgerId}, ${
                account.name
              }, ${account.externalId.toString()})`,
              action,
              amount.toFullPrecision(),
            ];
          }

          throw new Error('Invalid ledger account input');
        });

      const ledgerTransactionIdValues = rowsToInsert.map(
        (row) => row[0],
      ) as number[];
      const ledgerAccountIdValues = rowsToInsert.map(
        (row) => row[1],
      ) as number[];
      const actionValues = rowsToInsert.map((row) => row[2]) as number[];
      const amountValues = rowsToInsert.map((row) => row[3]) as number[];

      await transaction.query(sql.type(z.any())`
        INSERT INTO ledger_transaction_entry (ledger_transaction_id, ledger_account_id, action, amount)
        SELECT
          *
        FROM      
          unnest(
            ARRAY[${sql.join(
              ledgerTransactionIdValues,
              sql.fragment`, `,
            )}]::int4[],
            ARRAY[${sql.join(ledgerAccountIdValues, sql.fragment`, `)}]::int4[],
            ARRAY[${sql.join(
              actionValues,
              sql.fragment`, `,
            )}]::credit_or_debit[],
            ARRAY[${sql.join(amountValues, sql.fragment`, `)}]::numeric[]
          )       
      `);

      return {
        description: ledgerTransaction.description,
        id: ledgerTransactionId,
        ledgerId,
        postedAt,
      };
    });
  }

  private async getSavedAccountTypeById(id: DB_ID) {
    const foundAccountType = await this.connection.maybeOne(sql.type(
      LedgerAccountTypeShape,
    )`
      SELECT
        id,
        slug,
        name,
        description,
        normal_balance,
        is_entity_ledger_account,
        parent_ledger_account_type_id
      FROM ledger_account_type lat
      WHERE
          lat.id = ${id}
    `);

    if (!foundAccountType) {
      throw new LedgerError(`Account type ID: ${id} not found`);
    }

    return foundAccountType;
  }

  private async findSavedAccount(ledgerId: DB_ID, accountSlug: string) {
    return await this.connection.maybeOne(sql.type(LedgerAccountShape)`
        SELECT
          id,
          ledger_id,
          ledger_account_type_id,
          slug,
          description
        FROM ledger_account la
        WHERE
          la.ledger_id = ${ledgerId} AND
          la.slug = ${accountSlug}
    `);
  }
}
