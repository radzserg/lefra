import { LedgerAccountError } from '@/errors.js';
import { DB_ID } from '@/types.js';

const SYSTEM_PREFIX = 'SYSTEM';
const VALID_NAME_REGEX = /^[A-Z][A-Z_]*[A-Z]$/u;
export type LedgerAccountType = 'SYSTEM' | 'ENTITY';

export type EntityLedgerAccount = {
  readonly entityId: DB_ID;
  readonly name: string;
  type: 'ENTITY';
};

export type SystemLedgerAccount = {
  readonly name: string;
  type: 'SYSTEM';
};

export type LedgerAccount = EntityLedgerAccount | SystemLedgerAccount;

const validateName = (name: string) => {
  if (!name) {
    throw new LedgerAccountError('Account name cannot be empty');
  }

  if (!VALID_NAME_REGEX.test(name)) {
    throw new LedgerAccountError(
      `Account name can only contain uppercase letters without special characters. Name: ${name} is invalid`,
    );
  }
};

const validatePrefix = (name: string) => {
  if (!name) {
    throw new LedgerAccountError('Account prefix cannot be empty');
  }

  if (!VALID_NAME_REGEX.test(name)) {
    throw new LedgerAccountError(
      `Account prefix can only contain uppercase letters without special characters. Name: ${name} is invalid`,
    );
  }
};

export const entityAccount = (
  name: string,
  entityId: DB_ID,
  prefix: string = 'ENTITY',
) => {
  validateName(name);
  validatePrefix(prefix);
  if (prefix === SYSTEM_PREFIX) {
    throw new LedgerAccountError('Prefix SYSTEM is reserved');
  }

  return {
    entityId,
    name: `${prefix}_${name}`,
    type: 'ENTITY' as const,
  };
};

export const systemAccount = (name: string, prefix: string = SYSTEM_PREFIX) => {
  validateName(name);
  validatePrefix(prefix);

  return {
    name: `${prefix}_${name}`,
    type: 'SYSTEM' as const,
  };
};
