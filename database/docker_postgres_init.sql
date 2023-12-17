CREATE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TYPE credit_or_debit as ENUM (
  'CREDIT',
  'DEBIT'
  );

CREATE DOMAIN slug_text AS TEXT;

create table ledger_currency
(
  id integer generated always as identity primary key,
  code text not null constraint currency_code_check check (code = upper(code)),
  symbol text not null,
  minimum_fraction_digits integer not null constraint minimum_fraction_digits_check check (minimum_fraction_digits > 0 AND minimum_fraction_digits < 21),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger_currency FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

comment on table ledger_currency is 'Stores the currencies available in the ledger system. This can be fiat or crypto currencies, points or other types of currency.';
comment on column ledger_currency.code is 'Currency code. Should be in ISO 4217 format for fiat currencies. For crypto currencies, it should be the ticker symbol';
comment on column ledger_currency.symbol is 'Currency symbol. For fiat currencies, this should be the symbol used in the locale. For crypto currencies, this should be the ticker symbol';
comment on column ledger_currency.minimum_fraction_digits is 'Minimum number of digits to display after the decimal point. For fiat currencies, this should be the number of digits used in the locale. For crypto currencies, this should be the number of digits used in the ticker symbol';

-- create ledger
create table ledger
(
  id integer generated always as identity primary key,
  slug slug_text not null,
  name text not null,
  description text not null,
  ledger_currency_id  integer references ledger_currency on delete restrict,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index ledger_ledger_currency_id_idx
  on ledger (ledger_currency_id);

create unique index ledger_slug_idx on ledger (slug);
comment on table ledger is 'Stores the double entry ledgers available in the system';

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


create table ledger_account_type
(
  id integer generated always as identity primary key,
  slug slug_text not null,
  name text not null,
  normal_balance credit_or_debit not null,
  is_entity_ledger_account boolean not null,
  description text,
  parent_ledger_account_type_id  integer references ledger_account_type on delete restrict,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_account_type is 'Each account on the ledger must specify it''s type. This table contains all of the available types. Account types can be nested via parent_ledger_account_type_id';
comment on column ledger_account_type.name is 'Human readable account name for debugging purposes and for use in external accounting software';
comment on column ledger_account_type.is_entity_ledger_account is 'Whether or not this ledger account should be attached to a entity record(user, organization, team, etc.)';
comment on column ledger_account_type.parent_ledger_account_type_id is 'If this value is set, it means the account type is a sub-type of the associated type';

create index ledger_account_type_parent_ledger_account_type_id_idx
  on ledger_account_type (parent_ledger_account_type_id);

create unique index ledger_account_type_slug_idx on ledger_account_type (slug);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger_account_type FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


-- create ledger_account
create table ledger_account
(
  id integer generated always as identity primary key,
  ledger_id integer not null references ledger on delete restrict,
  ledger_account_type_id integer not null references ledger_account_type on delete restrict,
  slug slug_text NOT NULL,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_account is 'Represents an account on a given ledger. These accounts are used for ledger transactions';
comment on column ledger_account.description is 'Human readable account name for debugging purposes and for use in external accounting software';

create unique index ledger_account_slug_idx on ledger_account (ledger_id, slug);
create index ledger_account_ledger_id_fkey on ledger_account (ledger_id);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger_account FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- create ledger_ledger_account_type

create table ledger_ledger_account_type
(
  id integer generated always as identity primary key,
  ledger_id int not null references ledger,
  ledger_account_type_id int not null references ledger_account_type,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_ledger_account_type is 'This table is used to specify which ledger account types are available on a given ledger. This is used to restrict which account types can be used on a given ledger.';
comment on column ledger_ledger_account_type.ledger_id is 'ID of the ledger';
comment on column ledger_ledger_account_type.ledger_account_type_id is 'ID of the ledger account type';

create unique index ledger_ledger_account_type_unique_idx
  on ledger_ledger_account_type (ledger_id, ledger_account_type_id);


-- create ledger_transaction

create table ledger_transaction
(
  id integer generated always as identity primary key,
  ledger_id integer not null references ledger on delete restrict,
  posted_at timestamp with time zone default now() not null,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_transaction is 'High level transaction on the ledger. It holds a collection of individual ledger_transaction_entry records';
comment on column ledger_transaction.description is 'Human readable description/memo for debugging purposes and for use in external accounting software';

create index ledger_transaction_ledger_id_idx on ledger_transaction (ledger_id);
create index ledger_transaction_posted_at_idx on ledger_transaction (posted_at);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger_transaction FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- crete ledger_transaction_entry

create table ledger_transaction_entry
(
  id integer generated always as identity primary key,
  ledger_transaction_id integer not null references ledger_transaction on delete cascade,
  ledger_account_id integer not null references ledger_account on delete cascade,
  action credit_or_debit not null,
  amount numeric(18, 8) not null
    constraint ledger_transaction_entry_amount_positive check (amount > (0)::numeric),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_transaction_entry is 'Individual debit/credit entries for a ledger transaction';

create index ledger_transaction_entry_ledger_transaction_id_idx
  on ledger_transaction_entry (ledger_transaction_id);
create index ledger_transaction_entry_ledger_account_id_idx
  on ledger_transaction_entry (ledger_account_id);
create index ledger_transaction_entry_ledger_account_id_with_action_idx
  on ledger_transaction_entry (ledger_account_id, action);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE ON ledger_transaction_entry FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


CREATE OR REPLACE FUNCTION sum_up_ledger_account_balance(
  input_ledger_account_id int,
  input_sum_debits NUMERIC(18,8),
  input_sum_credits NUMERIC(18,8)
) RETURNS NUMERIC(18, 8) LANGUAGE plpgsql
AS $$
DECLARE
  account_balance_type credit_or_debit;
  balance NUMERIC(18,8);
BEGIN
  -- Determine normal balance type for account ('DEBIT' | 'CREDIT')
  SELECT normal_balance
  FROM ledger_account la
  INNER JOIN ledger_account_type lat ON
    la.ledger_account_type_id = lat.id
  WHERE la.id = input_ledger_account_id
  INTO account_balance_type;

  IF account_balance_type IS NULL THEN
    RAISE EXCEPTION 'Account does not exist. ID: %', input_ledger_account_id;
  END IF;

  IF account_balance_type = 'DEBIT' THEN
    balance = 0 + input_sum_debits - input_sum_credits;
  ELSEIF account_balance_type = 'CREDIT' THEN
    balance = 0 + input_sum_credits - input_sum_debits;
  ELSE
    RAISE EXCEPTION 'Unexpected account_balance_type: %', account_balance_type;
  END IF;

  RETURN balance;
END
$$;

CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int
) RETURNS NUMERIC(18, 8) language plpgsql
AS $$
DECLARE
  sum_debits NUMERIC(18,8);
  sum_credits NUMERIC(18,8);
BEGIN
  -- Sum up all debit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT'
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT'
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END $$;

CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int,
  before_date DATE
) RETURNS NUMERIC(18, 8) language plpgsql
AS $$
DECLARE
  sum_debits NUMERIC(18,8);
  sum_credits NUMERIC(18,8);
BEGIN
  -- Sum up all debit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT' AND
    lt.posted_at < before_date
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT' AND
    lt.posted_at < before_date
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END $$;

CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int,
  before_date DATE,
  after_date DATE
) RETURNS NUMERIC(18, 8)
  language plpgsql
AS $$
DECLARE
  sum_debits NUMERIC(18,8);
  sum_credits NUMERIC(18,8);
BEGIN
  IF before_date < after_date THEN
    RAISE EXCEPTION 'Before date is greater than after date';
  END IF;

  -- Sum up all debit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
    LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT' AND
    lt.posted_at < before_date AND
    lt.posted_at > after_date
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(sum(amount), 0)
  FROM ledger_transaction_entry lte
    LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT' AND
    lt.posted_at < before_date AND
    lt.posted_at > after_date
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END $$;


create function ledger_account_id(input_ledger_id int, input_ledger_account_slug text) returns integer
  language plpgsql
as
$$
DECLARE
  ledger_account_id int;
BEGIN
  SELECT id
  FROM ledger_account
  WHERE
    ledger_id = input_ledger_id AND
    slug = input_ledger_account_slug
  INTO ledger_account_id;

  RETURN ledger_account_id;
END;
$$;

create function ledger_account_id(input_ledger_id int, input_ledger_account_type_slug text, input_external_id text) returns integer
  language plpgsql
as
$$
DECLARE
  ledger_account_id int;
  account_type ledger_account_type;
  new_description text;
BEGIN
  SELECT id
  FROM ledger_account
  WHERE
    ledger_id = input_ledger_id AND
    slug = input_ledger_account_type_slug || ':' || input_external_id
  INTO ledger_account_id;

  IF ledger_account_id IS NOT NULL THEN
    RETURN ledger_account_id;
  END IF;

  SELECT *
  FROM ledger_account_type lat
  INNER JOIN ledger_ledger_account_type llat
    ON lat.id = llat.ledger_account_type_id
  WHERE
    slug = input_ledger_account_type_slug
    AND llat.ledger_id = input_ledger_id
  INTO account_type;

  IF account_type.id IS NULL THEN
    RAISE NOTICE 'Account type % not found', input_ledger_account_type_slug;
  END IF;

  SELECT
    CASE WHEN account_type.description IS NOT NULL
      THEN account_type.description || '. Account created for entity ID:' || input_external_id || '.'
    ELSE null
  END INTO new_description;

  INSERT INTO ledger_account (
    description,
    ledger_account_type_id,
    ledger_id,
    slug
  ) VALUES (
    new_description,
    account_type.id,
    input_ledger_id,
    input_ledger_account_type_slug || ':' || input_external_id
  ) RETURNING id
  INTO ledger_account_id;

  RETURN ledger_account_id;
END;
$$;
