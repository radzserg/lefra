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

##### Generate database structure

To begin using Lefra, you need to set up the necessary ledger structure in your database. Follow these steps:

1. **Ensure PostgreSQL Database:** Make sure you have a PostgreSQL database set up and ready to use.

2. **Export Database URL:** Export the database URL as an environment variable. You can do this in your terminal:

```sh
   export LFR_DATABASE_URL='postgresql://ledger:ledger@localhost:5476/ledger';
```

Initialize Lefra: Run the initialization command to generate the required [tables](./docs/ledger.png) for your ledger:

```sh
npm lefra init
```

You can also use the --dryRun option with npm lefra init --dryRun to review SQL changes before applying them. 
This is especially useful if you have custom migrations in place.


**Create Your First Ledger**

Each ledger in Lefra operates with a specific currency, which can be fiat money, cryptocurrencies, or bonus points.  




### Requirements and expectation

`Transaction` - valid only within one ledger. You cannot have entries with accounts referencing different ledgers.
