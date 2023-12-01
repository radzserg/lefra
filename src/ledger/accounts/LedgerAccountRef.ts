import { LedgerAccountError } from '@/errors.js';
import { DB_ID } from '@/types.js';

type LedgerAccountRefType = 'SYSTEM' | 'ENTITY';
export const ACCOUNT_NAME_SEPARATOR = '_';
export const SYSTEM_ACCOUNT_PREFIX = 'SYSTEM';

const VALID_NAME_REGEX = new RegExp(
  `^[A-Z][A-Z${ACCOUNT_NAME_SEPARATOR}]*[A-Z]$`,
  'u',
);
const VALID_PREFIX_REGEX = /^[A-Z]+$/u;

export abstract class LedgerAccountRef {
  public abstract readonly type: LedgerAccountRefType;

  protected constructor(
    public readonly ledgerId: DB_ID,
    public readonly slug: string,
  ) {}

  protected static validatePrefix(prefix: string) {
    if (!prefix) {
      throw new LedgerAccountError('Account name cannot be empty');
    }

    if (!VALID_PREFIX_REGEX.test(prefix)) {
      throw new LedgerAccountError(
        `Account prefix can only contain uppercase letters without special characters. Name: ${prefix} is invalid`,
      );
    }
  }

  protected static validateName(name: string) {
    if (!name) {
      throw new LedgerAccountError('Account name cannot be empty');
    }

    if (!VALID_NAME_REGEX.test(name)) {
      throw new LedgerAccountError(
        `Account name can only contain uppercase letters without special characters. Name: ${name} is invalid`,
      );
    }
  }
}
