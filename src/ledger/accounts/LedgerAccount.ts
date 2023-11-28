import { INTERNAL_ID } from '@/types.js';
import { v4 as uuid } from 'uuid';

export abstract class LedgerAccount {
  public readonly id: INTERNAL_ID = uuid();

  /**
   * Unique named identifier of this account.
   */
  public abstract get uniqueNamedIdentifier(): string;

  /**
   * Indicates whether this account can be inserted into the database.
   */
  public abstract canBeInserted: boolean;
}
