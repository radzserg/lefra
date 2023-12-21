# Lefra: Simplifying Bookkeeping with a Double-Entry Ledger Framework

## Prerequisites

- Lefra operates exclusively with Postgres database.

## Understanding the Double-Entry System

A double-entry system is a powerful method for tracking financial transactions in software. It ensures that every transaction records both the source of money and its purpose, preventing common errors and inconsistencies. This makes it a reliable choice for financial tracking in scalable applications.

#### Accounts

An account serves as an isolated container for various forms of value, including fiat currencies, cryptocurrencies, and bonus points. Imagine it as your personal bank checking account, securely holding your money, clearly marked as yours. Accounts can represent a wide range of balances, from an individual's balance in these various forms to different types of financial metrics. Typically, accounts are used to monitor and manage these balances.

#### Dual Aspect Accounting

In accounting, a significant innovation is the categorization of accounts into two types: debit normal and credit normal.

##### Debit Normal Accounts

Debit normal accounts represent funds you own or uses of money. Examples of uses of funds include assets and expenses. Activities like buying inventory, making investments, or even keeping cash in a bank account fall under the category of debit normal accounts.

##### Credit Normal Accounts

Credit normal accounts represent funds you owe or sources of money. Sources of funds encompass liabilities, equity, or revenue. This can include bank loans, investors' capital, accumulated profits, or income. Even activities like buying on credit are considered sources of funds because they provide you with financial resources. Accounts representing these balances are categorized as credit normal accounts.

Here's a simplified table to illustrate this concept:

| **Debit Normal Accounts** | **Credit Normal Accounts** |
|--------------------------|--------------------------|
| - Assets                | - Liabilities            |
| - Expenses              | - Equity                 |
|                        | - Revenue                |

This classification system helps clarify whether an account represents a use or source of funds, providing a fundamental framework for accounting transactions.

#### Transactions

Transactions are fundamental events that impact account balances. They consist of entries, with each transaction having at least two entries, each associated with a specific account. For instance, in a scenario where Jim sends $50 to Mary using a mobile payment app, the transaction records entries for both Jim's and Mary's accounts, reflecting the change in their respective balances.


## Getting started

##### Generate database structure

To begin using Lefra for streamlined bookkeeping, follow these steps:

**Generate Database Structure**

 Before you can start using Lefra, ensure that you have a PostgreSQL database set up. You'll need to export the 
 database URL as an environment variable and then run the initialization command. Here's how you can do it:

```sh
export LFR_DATABASE_URL='postgresql://ledger:ledger@localhost:5476/ledger';
npm lefra init
```

This command will generate the necessary [tables](./docs/ledger.png) for your ledger. You can also use the `--dryRun` 
option with `npm lefra init --dryRun` to review SQL changes before applying them. This 
can be particularly useful if you use your own migrations.

**Create Your First Ledger**

Each ledger in Lefra operates with a specific currency, which can be fiat money, cryptocurrencies, or bonus points. 
To create your first ledger, follow these SQL commands as an example:

```sql

INSERT INTO ledger_currency (code, symbol, minimum_fraction_digits) 
VALUES ('USD', '$', 2);


INSERT INTO ledger (slug, name, description, ledger_currency_id) 
VALUES ('MYAPP_PLATFORM_USD', 'MyApp Platform USD', 'The main ledger used for MyApp''s platform', 1);
```

Next thing we have to do is define account types. Let's use some real world example to help understand this process better. 
In this example, we will assume you are running a marketplace like Airbnb where a guest can rent a property from a 
property owner. We will demonstrate a simple flow here with 3 events:

- The guest books a stay
- The guest pays for the stay
- The marketplace pays out the property owner




### Requirements and expectation

`Transaction` - valid only within one ledger. You cannot have entries with accounts referencing different ledgers.
