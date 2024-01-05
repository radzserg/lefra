CREATE FUNCTION update_updated_at()
  RETURNS trigger AS
$$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE 'plpgsql';

CREATE TYPE credit_or_debit AS enum (
  'CREDIT',
  'DEBIT'
  );

CREATE DOMAIN slug_text AS text;

CREATE TABLE ledger_currency
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  code text NOT NULL
    CONSTRAINT currency_code_check
      CHECK (code = UPPER(code)),
  symbol text NOT NULL,
  minimum_fraction_digits integer NOT NULL
    CONSTRAINT minimum_fraction_digits_check
      CHECK (minimum_fraction_digits >= 0 AND minimum_fraction_digits < 21),
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX ledger_currency_code_idx ON ledger_currency (code);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger_currency
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

COMMENT ON TABLE ledger_currency IS 'Stores the currencies available in the ledger system. This can be fiat or crypto currencies, points or other types of currency.';
COMMENT ON COLUMN ledger_currency.code IS 'Currency code. Should be in ISO 4217 format for fiat currencies. For crypto currencies, it should be the ticker symbol';
COMMENT ON COLUMN ledger_currency.symbol IS 'Currency symbol. For fiat currencies, this should be the symbol used in the locale. For crypto currencies, this should be the ticker symbol';
COMMENT ON COLUMN ledger_currency.minimum_fraction_digits IS 'Minimum number of digits to display after the decimal point. For fiat currencies, this should be the number of digits used in the locale. For crypto currencies, this should be the number of digits used in the ticker symbol';

-- create ledger
CREATE TABLE ledger
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  slug slug_text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  ledger_currency_id integer
    REFERENCES ledger_currency
      ON DELETE RESTRICT,
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ledger_ledger_currency_id_idx
  ON ledger (ledger_currency_id);

CREATE UNIQUE INDEX ledger_slug_idx ON ledger (slug);
COMMENT ON TABLE ledger IS 'Stores the double entry ledgers available in the system';

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


CREATE TABLE ledger_account_type
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  slug slug_text NOT NULL,
  name text NOT NULL,
  normal_balance credit_or_debit NOT NULL,
  is_entity_ledger_account boolean NOT NULL,
  description text,
  parent_ledger_account_type_id integer
    REFERENCES ledger_account_type
      ON DELETE RESTRICT,
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ledger_account_type IS 'Each account on the ledger must specify it''s type. This table contains all of the available types. Account types can be nested via parent_ledger_account_type_id';
COMMENT ON COLUMN ledger_account_type.name IS 'Human readable account name for debugging purposes and for use in external accounting software';
COMMENT ON COLUMN ledger_account_type.is_entity_ledger_account IS 'Whether or not this ledger account should be attached to a entity record(user, organization, team, etc.)';
COMMENT ON COLUMN ledger_account_type.parent_ledger_account_type_id IS 'If this value is set, it means the account type is a sub-type of the associated type';

CREATE INDEX ledger_account_type_parent_ledger_account_type_id_idx
  ON ledger_account_type (parent_ledger_account_type_id);

CREATE UNIQUE INDEX ledger_account_type_slug_idx ON ledger_account_type (slug);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger_account_type
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


-- create ledger_account
CREATE TABLE ledger_account
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  ledger_id integer NOT NULL
    REFERENCES ledger
      ON DELETE RESTRICT,
  ledger_account_type_id integer NOT NULL
    REFERENCES ledger_account_type
      ON DELETE RESTRICT,
  slug slug_text NOT NULL,
  description text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ledger_account IS 'Represents an account on a given ledger. These accounts are used for ledger transactions';
COMMENT ON COLUMN ledger_account.description IS 'Human readable account name for debugging purposes and for use in external accounting software';

CREATE UNIQUE INDEX ledger_account_slug_idx ON ledger_account (ledger_id, slug);
CREATE INDEX ledger_account_ledger_id_fkey ON ledger_account (ledger_id);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger_account
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- create ledger_ledger_account_type

CREATE TABLE ledger_ledger_account_type
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  ledger_id int NOT NULL
    REFERENCES ledger,
  ledger_account_type_id int NOT NULL
    REFERENCES ledger_account_type,
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ledger_ledger_account_type IS 'This table is used to specify which ledger account types are available on a given ledger. This is used to restrict which account types can be used on a given ledger.';
COMMENT ON COLUMN ledger_ledger_account_type.ledger_id IS 'ID of the ledger';
COMMENT ON COLUMN ledger_ledger_account_type.ledger_account_type_id IS 'ID of the ledger account type';

CREATE UNIQUE INDEX ledger_ledger_account_type_unique_idx
  ON ledger_ledger_account_type (ledger_id, ledger_account_type_id);


-- create ledger_transaction

CREATE TABLE ledger_transaction
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  ledger_id integer NOT NULL
    REFERENCES ledger
      ON DELETE RESTRICT,
  posted_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  description text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ledger_transaction IS 'High level transaction on the ledger. It holds a collection of individual ledger_transaction_entry records';
COMMENT ON COLUMN ledger_transaction.description IS 'Human readable description/memo for debugging purposes and for use in external accounting software';

CREATE INDEX ledger_transaction_ledger_id_idx ON ledger_transaction (ledger_id);
CREATE INDEX ledger_transaction_posted_at_idx ON ledger_transaction (posted_at);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger_transaction
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- crete ledger_transaction_entry

CREATE TABLE ledger_transaction_entry
(
  id integer GENERATED ALWAYS AS IDENTITY
    PRIMARY KEY,
  ledger_transaction_id integer NOT NULL
    REFERENCES ledger_transaction
      ON DELETE CASCADE,
  ledger_account_id integer NOT NULL
    REFERENCES ledger_account
      ON DELETE CASCADE,
  action credit_or_debit NOT NULL,
  amount numeric(18, 8) NOT NULL
    CONSTRAINT ledger_transaction_entry_amount_positive
      CHECK (amount > (0)::numeric),
  created_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ledger_transaction_entry IS 'Individual debit/credit entries for a ledger transaction';

CREATE INDEX ledger_transaction_entry_ledger_transaction_id_idx
  ON ledger_transaction_entry (ledger_transaction_id);
CREATE INDEX ledger_transaction_entry_ledger_account_id_idx
  ON ledger_transaction_entry (ledger_account_id);
CREATE INDEX ledger_transaction_entry_ledger_account_id_with_action_idx
  ON ledger_transaction_entry (ledger_account_id, action);

CREATE TRIGGER update_user_task_updated_on
  BEFORE UPDATE
  ON ledger_transaction_entry
  FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();


CREATE FUNCTION ledger_transaction_entry_after_insert_trigger() RETURNS trigger
  LANGUAGE plpgsql
AS
$$
BEGIN
  -- Ensure total debits == total credits
  IF
    (SELECT COALESCE(SUM(amount), 0)
    FROM ledger_transaction_entry
    WHERE ledger_transaction_id = new.ledger_transaction_id AND action = 'DEBIT')
      !=
    (SELECT COALESCE(SUM(amount), 0)
    FROM ledger_transaction_entry
    WHERE ledger_transaction_id = new.ledger_transaction_id AND action = 'CREDIT')
  THEN
    RAISE EXCEPTION 'Debits != Credits for Ledger Transaction Entries';
  END IF;

  RETURN new;
END;
$$;

CREATE CONSTRAINT TRIGGER ledger_transaction_entry_after_insert_trigger
  AFTER INSERT OR UPDATE
  ON ledger_transaction_entry
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
EXECUTE PROCEDURE ledger_transaction_entry_after_insert_trigger();

CREATE OR REPLACE FUNCTION sum_up_ledger_account_balance(
  input_ledger_account_id int,
  input_sum_debits numeric(18, 8),
  input_sum_credits numeric(18, 8)
) RETURNS numeric(18, 8)
  LANGUAGE plpgsql
AS
$$
DECLARE
  account_balance_type credit_or_debit;
  balance              numeric(18, 8);
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
) RETURNS numeric(18, 8)
  LANGUAGE plpgsql
AS
$$
DECLARE
  sum_debits  numeric(18, 8);
  sum_credits numeric(18, 8);
BEGIN
  -- Sum up all debit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT'
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT'
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END
$$;

CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int,
  before_date date
) RETURNS numeric(18, 8)
  LANGUAGE plpgsql
AS
$$
DECLARE
  sum_debits  numeric(18, 8);
  sum_credits numeric(18, 8);
BEGIN
  -- Sum up all debit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT' AND
    lt.posted_at < before_date
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT' AND
    lt.posted_at < before_date
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END
$$;

CREATE OR REPLACE FUNCTION calculate_balance_for_ledger_account(
  input_ledger_account_id int,
  before_date date,
  after_date date
) RETURNS numeric(18, 8)
  LANGUAGE plpgsql
AS
$$
DECLARE
  sum_debits  numeric(18, 8);
  sum_credits numeric(18, 8);
BEGIN
  IF before_date < after_date THEN
    RAISE EXCEPTION 'Before date is greater than after date';
  END IF;

  -- Sum up all debit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'DEBIT' AND
    lt.posted_at < before_date AND
    lt.posted_at > after_date
  INTO sum_debits;

  -- Sum up all credit entries for this account
  SELECT COALESCE(SUM(amount), 0)
  FROM ledger_transaction_entry lte
  LEFT JOIN ledger_transaction lt ON lte.ledger_transaction_id = lt.id
  WHERE
    ledger_account_id = input_ledger_account_id AND
    action = 'CREDIT' AND
    lt.posted_at < before_date AND
    lt.posted_at > after_date
  INTO sum_credits;

  RETURN sum_up_ledger_account_balance(input_ledger_account_id, sum_debits, sum_credits);
END
$$;


CREATE FUNCTION ledger_account_id(input_ledger_id int, input_ledger_account_slug text) RETURNS integer
  LANGUAGE plpgsql
AS
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

CREATE FUNCTION ledger_account_id(input_ledger_id int, input_ledger_account_type_slug text,
                                  input_external_id text) RETURNS integer
  LANGUAGE plpgsql
AS
$$
DECLARE
  ledger_account_id int;
  account_type      ledger_account_type;
  new_description   text;
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
    slug = input_ledger_account_type_slug AND llat.ledger_id = input_ledger_id
  INTO account_type;

  IF account_type.id IS NULL THEN
    RAISE NOTICE 'Account type % not found', input_ledger_account_type_slug;
  END IF;

  SELECT CASE
           WHEN account_type.description IS NOT NULL
             THEN account_type.description || '. Account created for entity ID:' || input_external_id || '.'
           ELSE NULL
         END
  INTO new_description;

  INSERT INTO ledger_account (
    description,
    ledger_account_type_id,
    ledger_id,
    slug
  )
  VALUES (
    new_description,
    account_type.id,
    input_ledger_id,
    input_ledger_account_type_slug || ':' || input_external_id
  )
  RETURNING id
    INTO ledger_account_id;

  RETURN ledger_account_id;
END;
$$;
