import { LedgerAccountError } from '@/errors.js';
import { INTERNAL_ID } from '@/types.js';
import { v4 as uuid } from 'uuid';

export abstract class LedgerAccount {
  public readonly id: INTERNAL_ID = uuid();

  /**
   * Unique named identifier of this account.
   */
  public abstract get uniqueNamedIdentifier(): string;

  protected validateName(name: string) {
    if (!name) {
      throw new Error('Account name cannot be empty');
    }

    const nameRegex = /^[A-Z]+$/u;
    if (!nameRegex.test(name)) {
      throw new LedgerAccountError(
        'Account name can only contain uppercase letters without special characters',
      );
    }
  }
}
