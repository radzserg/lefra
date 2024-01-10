# Lefra: Simplifying Bookkeeping with a Double-Entry Ledger Framework

## Prerequisites

- Lefra is designed to work exclusively with a Postgres database.
- Lefra relies on the slonik library to interact with Postgres.

## Understanding the Double-Entry System

A double-entry system is a powerful method for tracking financial transactions in software. It ensures that every 
transaction records both the source of money and its purpose, preventing common errors and inconsistencies. This 
makes it a reliable choice for financial tracking in scalable applications.

[Detailed guidance - How double-entry works](https://radzserg.medium.com/double-entry-accounting-guide-for-software-engineers-part-two-how-double-entry-works-eaa4c6bd27c4)

#### Accounts

An account serves as an isolated container for various forms of value, including fiat currencies, cryptocurrencies, 
and bonus points. Imagine it as your personal bank checking account, securely holding your money, clearly marked as 
yours. Accounts can represent a wide range of balances, from an individual's balance in these various forms to different 
types of financial metrics. Typically, accounts are used to monitor and manage these balances.

#### Dual Aspect Accounting

In accounting, a significant innovation is the categorization of accounts into two types: debit normal and credit normal.

##### Debit Normal Accounts

Debit normal accounts represent funds you own or uses of money. Examples of uses of funds include assets and expenses. 
Activities like buying inventory, making investments, or even keeping cash in a bank account fall under the category of debit normal accounts.

##### Credit Normal Accounts

Credit normal accounts represent funds you owe or sources of money. Sources of funds encompass liabilities, equity, 
or revenue. This can include bank loans, investors' capital, accumulated profits, or income. Even activities like buying on credit are considered sources of funds because they provide you with financial resources. Accounts representing these balances are categorized as credit normal accounts.

Here's a simplified table to illustrate this concept:

| **Debit Normal Accounts** | **Credit Normal Accounts** |
|--------------------------|--------------------------|
| - Assets                | - Liabilities            |
| - Expenses              | - Equity                 |
|                        | - Revenue                |

This classification system helps clarify whether an account represents a use or source of funds, providing a fundamental 
framework for accounting transactions.

#### Double Entry Structure

The essence of the double-entry system lies in its structure, where every transaction involves at least two entries, 
one debiting an account and the other crediting an account. This structure ensures that the total value of debit 
entries equals the total value of credit entries, maintaining the balance of the accounting equation. In essence, 
it's like a mathematical equation where both sides must always add up, providing accuracy and consistency in 
financial records.

#### Transactions

Transactions are fundamental events that impact account balances. They consist of entries, with each transaction 
having at least two entries, each associated with a specific account. For instance, in a scenario where Jim sends 
$50 to Mary using a mobile payment app, the transaction records entries for both Jim's and Mary's accounts, 
reflecting the change in their respective balances.


## Getting started

### Generate database structure

To begin using Lefra, you need to set up the necessary ledger structure in your database. Follow these steps:

1. **Ensure PostgreSQL Database:** Make sure you have a PostgreSQL database set up and ready to use.

2. **Create database tables:** Run the initialization command to generate the required [tables](./docs/ledger.png) for your ledger:

```sh
export LFR_DATABASE_URL='postgresql://ledger:ledger@localhost:5432/ledger'
npm lefra init
```

You can also use the `--dryRun` option with npm lefra init `--dryRun` to review SQL changes before applying them. 
This is especially useful if you have custom migrations in place.

### Create Your First Ledger

Your ledger's configuration can be customized to align precisely with your unique business needs. To help you get 
started, let's delve into the process of creating a ledger structure, using the Firecnc application as a practical 
example. Firecnc facilitates apartment owners in renting their properties to tenants, making it a suitable reference 
for our demonstration. Below, you'll find a visual representation of a preliminary ledger structure. 

![ledger sample structure](./docs/Ledger_Sample.jpg)

##### Create storage 

Let's create storage for our ledger.
```typescript
const storage = new PostgresLedgerStorage(process.env.LFR_DATABASE_URL!);
```

##### Currency 

Every ledger operates with a specific currency, which can be fiat money, cryptocurrencies, or bonus points.
To add USD currency for your ledger, you can use the following code:

```typescript
const usdCurrency = await storage.insertCurrency({
  code: 'USD',
  minimumFractionDigits: 2,
  symbol: '$',
});
```

_Alternatively, you can achieve this by running the SQL command below:_ 
```sql
INSERT INTO ledger_currency (code, symbol, minimum_fraction_digits) 
VALUES ('USD', '$', 2);
```

##### Ledger 

Next, create the main USD ledger for your application.

```typescript

const ledger = await storage.insertLedger({
  description: "The main USD ledger for Firecnc",
  ledgerCurrencyId: usdCurrency.id,
  name: 'Firecnc Platform USD',
  slug: 'FIRECNC_PLATFORM_USD',
});
```

_Alternatively, you can achieve this by running the SQL command below:_
```sql
INSERT INTO ledger (slug, name, description, ledger_currency_id) 
VALUES ('FIRECNC_PLATFORM_USD', 'Firecnc Platform USD', 'The main USD ledger for Firecnc', ${usdCurrency.id});
```

###### Add ledger account types 

Now, let's add ledger account types. In this example, we'll create an "Assets" account type. This type represents 
valuable resources and possessions owned by the company or organization, such as cash, property, equipment, and 
investments. Use this code to define the account type:

```typescript

const accountType = await storage.insertAccountType({
  description:
    'Accounts in this category represent the valuable resources and possessions owned by the company ' +
    'or organization. These can include cash, property, equipment, investments, and more. Assets are things of value ' +
    "that contribute to the entity's financial well-being.",
  isEntityLedgerAccount: false,
  name: 'Assets',
  normalBalance: 'DEBIT' as NormalBalance,
  parentLedgerAccountTypeSlug: null,
  slug: 'ASSETS',
});

// Now let's allow our ledger to use these account types
await storage.assignAccountTypeToLedger({
  accountTypeId: accountType.id,
  ledgerId,
});
```

_Alternatively, you can achieve this by running the SQL command below:_
```sql
INSERT INTO ledger_account_type(slug, name, normal_balance, is_entity_ledger_account, description, parent_ledger_account_type_id)
VALUES (
  'ASSETS',
  'Assets',
  'DEBIT',
  false,
  'Accounts in this category represent the valuable resources and possessions owned by the company or organization. These can include cash, property, equipment, investments, and more. Assets are things of value that contribute to the entity''s financial well-being.',
  NULL
);

INSERT INTO ledger_ledger_account_type (ledger_id, ledger_account_type_id) VALUES (1, 1);
```


Account types possess the capability to reference parent account types. For instance, the "Payables" account type may be 
linked to parent "Liabilities" account types, creating a hierarchical structure.

There exist two primary categories of account types: "system" and "entity."

System Account Types: These account types represent distinct system accounts within the ledger. They are typically 
predefined to serve specific system-level functions. Here are some examples:

OWNER_FUNDS: This account type signifies the funds held by the platform's owner.
EXPENSES_STRIPE_FEES: It records expenses associated with Stripe payment processing fees incurred by the platform.
CURRENT_ASSETS_STRIPE_PLATFORM_USA: This account type monitors the current assets held by the platform within the 
USA-based Stripe platform.
Each system account type generally corresponds to one system account.

Entity Account Types: These specific account types are designed for use with entity accounts and are allocated to 
entities such as users, teams, or workspaces, in accordance with your specific business needs. As an illustration, 
each user may be linked to a "receivables" account. It's crucial to emphasize that entity accounts (which should not 
be confused with account types) are dynamically generated as required to align with particular entities. Typically, 
these accounts are referred to using an entity ID format, such as "USER_RECEIVABLES:${userId}" or 
"TEAM_PAYABLES:${teamId}", enabling precise identification and tracking within the ledger.

###### Add ledger accounts

Lastly, add the necessary system ledger accounts as required. As mentioned above, there's no need to manually create entity accounts, 
as they will be generated automatically when necessary. As an illustrative example, let's create an "Owner Funds Account" 
using the provided code:


```typescript
await storage.insertAccount({
  description: 'Owner Funds Account',
  slug: 'OWNER_FUNDS',
  ledgerAccountTypeId,
  ledgerId,
});
```

_Alternatively, you can achieve this by running the SQL command below:_
```sql
INSERT INTO ledger_account (ledger_id, ledger_account_type_id, slug, description) 
VALUES (1, 1, 'OWNER_FUNDS', 'Owner Funds Account');
```

###### Generate Typescript ledger specification

To complete the process, after adding all account types and accounts to the database, you can generate a specification 
that will improve type checking in your application. Use the following script:

```sh
npm generate --className FirecncPlatformUsdLedger --ledgerSlug FIRECNC_PLATFORM_USD --path ./src/ledger/FirecncPlatformUsdLedger.ts
```

This generated specification will enhance the accuracy of type checking and facilitate smoother integration of your 
ledger into your application.

```typescript
export const FirecncPlatformUsdLedger = {
  currencyCode: 'USD',
  entityAccountTypes: [
    'OWNERS_ACCOUNTS_PAYABLES',
    'OWNERS_ACCOUNTS_PAYABLES_LOCKED',
  ] as const,
  slug: 'FIRECNC_PLATFORM_USD',
  systemAccounts: [
    'OWNER_FUNDS',
    'EXPENSES_STRIPE_FEES',
    'LIABILITIES_STRIPE_FEES',
    'CURRENT_ASSETS_STRIPE_PLATFORM_USA',
    'SUBSCRIPTION_PROFIT',
    'BOOKINGS_PROFIT',
    'REFUNDS',
    'STRIPE_PAY_IN_FEES',
    'BOOKING_HOLDINGS',
  ] as const,
};

```


### Recording Ledger Transactions

A ledger transaction represents a collection of double entries, where each entry consists of a debit and a credit 
operation. It's essential to note that the sum of credit operations must always be equal to the sum of debit operations for a transaction to maintain balance.

Before diving into transactions, let's start by creating a handy utility function that simplifies currency handling.

```typescript
import { Unit } from 'lefra';
export const usd = (amount: number | string) => {
  return new Unit(amount, 'USD', 2);
};
```

Now, let's proceed to record the transaction itself. Below is the code illustrating the process:

```typescript
const entries = new TransactionDoubleEntries([
  doubleEntry(
    debit(
      SystemAccountRef('FIRECNC_PLATFORM_USD', 'CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
      usd(100),
    ),
    [
      credit(
        EntityAccountRef('FIRECNC_PLATFORM_USD', 'OWNERS_ACCOUNTS_PAYABLES_LOCKED', tenantUserId),
        usd(80),
      ),
      credit(
        EntityAccountRef('FIRECNC_PLATFORM_USD', 'OWNERS_ACCOUNTS_PAYABLES', tenantUserId),
        usd(20),
      ),
    ],
    'Tenant Payment Received and Held in CURRENT_ASSETS_STRIPE_PLATFORM_USA for Owner',
  ),
  doubleEntry(
    debit(SystemAccountRef('FIRECNC_PLATFORM_USD', 'STRIPE_PAY_IN_FEES'), paymentProcessingFee),
    credit(SystemAccountRef('FIRECNC_PLATFORM_USD', 'STRIPE_PAY_IN_FEES'), paymentProcessingFee),
    'Recording payment processing fee entry',
  ),
]);

const transaction = new Transaction(entries, `Tenant:${tenantUserId} deposited ${bookingTargetAmount.format()} into the company's current assets`)
await storage.insertTransaction(entries);

```

### Recording Ledger Transactions using Operations 

Lefra follows the open-close principle, advocating the addition of new operations for various scenarios without 
the need to modify existing code. Let's delve into how this approach works in practice.

```typescript

# TenantMakesBookingOperationWithUpfront.ts 

import { FirecncPlatformUsdLedger } from '../FirecncPlatformUsdLedger.js';    // let's use our specification
import { USD } from '../money.js';
import {
  credit,
  debit,
  doubleEntry,
  ILedgerOperation,
  ledgerAccountsRefBuilder,
  Transaction,
  TransactionDoubleEntries,
} from 'lefra';

type OperationPayload = {
  bookingTargetAmount: USD;
  lockedAmount: USD;
  paymentProcessingFee: USD;
  tenantUserId: number;
  upfrontPaymentAmount: USD;
};

export class TenantMakesBookingOperationWithUpfront
  implements ILedgerOperation
{
  public constructor(private readonly payload: OperationPayload) {}

  public async createTransaction() {
    const {
      bookingTargetAmount,
      lockedAmount,
      paymentProcessingFee,
      tenantUserId,
      upfrontPaymentAmount,
    } = this.payload;

    // this helper allows us to reference account types with proper runtime type checking
    const account = ledgerAccountsRefBuilder(FirecncPlatformUsdLedger);
    const entries = new TransactionDoubleEntries([
      doubleEntry(
        debit(
          account('CURRENT_ASSETS_STRIPE_PLATFORM_USA'),
          bookingTargetAmount,
        ),
        [
          credit(
            account('OWNERS_ACCOUNTS_PAYABLES_LOCKED', tenantUserId),
            lockedAmount,
          ).mayHaveZero(),
          credit(
            account('OWNERS_ACCOUNTS_PAYABLES', tenantUserId),
            upfrontPaymentAmount,
          ).mayHaveZero(),
        ],
        'Tenant Payment Received and Held in CURRENT_ASSETS_STRIPE_PLATFORM_USA for Owner',
      ),
      doubleEntry(
        debit(account('STRIPE_PAY_IN_FEES'), paymentProcessingFee),
        credit(account('STRIPE_PAY_IN_FEES'), paymentProcessingFee),
        'Recording payment processing fee entry',
      ),
    ]);

    return new Transaction(
      entries,
      `Tenant:${tenantUserId} deposited ${bookingTargetAmount.format()} into the company's current assets`,
    );
  }
}

// use 
const storage = new PostgresLedgerStorage(process.env.LFR_DATABASE_URL!);
const ledger = new Ledger(storage);

await ledger.record(
  new TenantMakesBookingOperationWithUpfront({
    bookingTargetAmount: usd(100),
    lockedAmount: usd(70),
    paymentProcessingFee: usd(3.3),
    tenantUserId: 1,
    upfrontPaymentAmount: usd(30),
  }),
)

const lockedBalance = await ledger.fetchAccountBalance(
  account('OWNERS_ACCOUNTS_PAYABLES_LOCKED', 1),
);

```