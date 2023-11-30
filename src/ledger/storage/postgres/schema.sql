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

CREATE DOMAIN foreign_entity_id as integer;

CREATE DOMAIN slug_text AS TEXT;

-- create ledger
create table if not exists ledger
(
  id integer generated always as identity primary key,
  slug slug_text not null,
  name text not null,
  description text not null,
  currency_code text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create unique index if not exists ledger_slug_idx on ledger (slug);
comment on table ledger is 'Stores the double entry ledgers available in the system';

CREATE TRIGGER update_user_task_updated_on
BEFORE UPDATE ON ledger FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- create ledger ledger_account_type

create table if not exists ledger_account_type
(
  id integer generated always as identity primary key,
  ledger_id integer references ledger on delete restrict,
  slug slug_text not null,
  name text not null,
  normal_balance credit_or_debit not null,
  is_entity_ledger_account boolean not null,
  parent_ledger_account_type_id  integer references ledger_account_type on delete restrict,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_account_type is 'Each account on the ledger must specify it''s type. This table contains all of the available types. Account types can be nested via parent_ledger_account_type_id';
comment on column ledger_account_type.name is 'Human readable account name for debugging purposes and for use in external accounting software';
comment on column ledger_account_type.is_entity_ledger_account is 'Whether or not this ledger account should be attached to a entity record(user, organization, team, etc.)';
comment on column ledger_account_type.parent_ledger_account_type_id is 'If this value is set, it means the account type is a sub-type of the associated type';

create index if not exists ledger_account_type_parent_ledger_account_type_id_idx
  on ledger_account_type (parent_ledger_account_type_id);

create unique index if not exists ledger_account_type_slug_idx on ledger_account_type (ledger_id, slug);

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
  name text not null,
  entity_id foreign_entity_id,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_account is 'Represents an account on a given ledger. These accounts are used for ledger transactions';
comment on column ledger_account.entity_id is 'The user account that this ledger account belongs to';
comment on column ledger_account.description is 'Human readable account name for debugging purposes and for use in external accounting software';

create unique index if not exists ledger_account_slug_idx on ledger_account (ledger_id, slug);
create unique index if not exists ledger_account_entity_idx on ledger_account (ledger_id, slug, entity_id);
create index if not exists ledger_account_ledger_id_fkey on ledger_account (ledger_id);
create index if not exists ledger_account_entity_id_idx on ledger_account (entity_id);

create unique index if not exists ledger_account_user_account_id_account_type_idx
  on ledger_account (entity_id, ledger_account_type_id)
  where (entity_id IS NOT NULL);

CREATE TRIGGER update_user_task_updated_on
BEFORE UPDATE ON ledger_account FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- create ledger_transaction

create table if not exists ledger_transaction
(
  id integer generated always as identity primary key,
  ledger_id integer not null references ledger on delete restrict,
  posted_at timestamp with time zone default now() not null,
  description text,
  created_by text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table ledger_transaction is 'High level transaction on the ledger. It holds a collection of individual ledger_transaction_entry records';
comment on column ledger_transaction.description is 'Human readable description/memo for debugging purposes and for use in external accounting software';
comment on column ledger_transaction.created_by is 'Who created the transaction.';

create index if not exists ledger_transaction_ledger_id_idx on ledger_transaction (ledger_id);
create index if not exists ledger_transaction_posted_at_idx on ledger_transaction (posted_at);

CREATE TRIGGER update_user_task_updated_on
BEFORE UPDATE ON ledger_transaction FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- crete ledger_transaction_entry

create table if not exists ledger_transaction_entry
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

create index if not exists ledger_transaction_entry_ledger_transaction_id_idx
  on ledger_transaction_entry (ledger_transaction_id);
create index if not exists ledger_transaction_entry_ledger_account_id_idx
  on ledger_transaction_entry (ledger_account_id);
create index if not exists ledger_transaction_entry_ledger_account_id_with_action_idx
  on ledger_transaction_entry (ledger_account_id, action);

CREATE TRIGGER update_user_task_updated_on
BEFORE UPDATE ON ledger_transaction_entry FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int,
  before_date DATE,
  after_date DATE
) RETURNS NUMERIC(18, 8)
AS $$
DECLARE
  account_balance_type credit_or_debit;
  balance NUMERIC(18,8);
  sum_debits NUMERIC(18,8);
  sum_credits NUMERIC(18,8);
BEGIN
  IF before_date < after_date THEN
    RAISE EXCEPTION 'Before date is greater than after date';
  END IF;

  -- Determine normal balance type for account ('DEBIT' | 'CREDIT')
  SELECT normal_balance FROM ledger_account la
  INNER JOIN ledger_account_type lat ON
    la.ledger_account_type_id = lat.id
  WHERE la.id = input_ledger_account_id
  INTO account_balance_type;

  IF account_balance_type IS NULL THEN
    RAISE EXCEPTION 'Account does not exist. ID: %', input_ledger_account_id;
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

  IF account_balance_type = 'DEBIT' THEN
    balance = 0 + sum_debits - sum_credits;
  ELSEIF account_balance_type = 'CREDIT' THEN
    balance = 0 + sum_credits - sum_debits;
  ELSE
    RAISE EXCEPTION 'Unexpected account_balance_type: %', account_balance_type;
  END IF;

  RETURN balance;
END $$
  LANGUAGE plpgsql;