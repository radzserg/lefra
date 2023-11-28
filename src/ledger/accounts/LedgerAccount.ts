import { LedgerAccountError } from '@/errors.js';

export abstract class LedgerAccount {
  /**
   * Unique named identifier of this account.
   */
  public abstract get namedIdentifier(): string;

  protected validateName(name: string) {
    if (!name) {
      throw new Error('Account name cannot be empty');
    }

    const nameRegex = /^[A-Z][A-Z_]*[A-Z]$/u;
    if (!nameRegex.test(name)) {
      throw new LedgerAccountError(
        `Account name can only contain uppercase letters without special characters. Name: ${name} is invalid`,
      );
    }
  }
}
