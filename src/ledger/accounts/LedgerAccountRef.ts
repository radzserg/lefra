import { LedgerAccountError } from '@/errors.js';

type LedgerAccountRefType = 'SYSTEM' | 'ENTITY';
export const ACCOUNT_NAME_SEPARATOR = '_';

const VALID_NAME_REGEX = new RegExp(
  `^[A-Z][A-Z${ACCOUNT_NAME_SEPARATOR}]*[A-Z]$`,
  'u',
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LedgerAccountRefBuilder = (...args: any) => LedgerAccountRef;

/**
 * Represents a reference to a ledger account.
 * The reference is a slug that is used to identify the account.
 * The reference does not check if the account exists. It is only a reference.
 */
export abstract class LedgerAccountRef {
  public abstract readonly type: LedgerAccountRefType;

  protected constructor(
    public readonly ledgerSlug: string,
    public readonly accountSlug: string,
  ) {}

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
