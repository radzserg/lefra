import { v4 as uuid } from "uuid";
import { UserLedgerAccount } from "./UserLedgerAccount";
import { SystemLedgerAccount } from "./SystemLedgerAccount";

export abstract class LedgerAccount {
  public readonly id: string = uuid();

  /**
   * Unique named identifier of this account.
   */
  public abstract get uniqueNamedIdentifier(): string;

  /**
   * Indicates whether this account can be inserted into the database.
   */
  public abstract canBeInserted: boolean;
}

/**
 * Shorthand to create ledger account
 */
export const createAccountFactory = (
  ledgerId: string,
): ((name: string, userAccountId?: number) => LedgerAccount) => {
  return (name: string, id?: number) => {
    if (id) {
      return new UserLedgerAccount(ledgerId, name, id);
    }
    return new SystemLedgerAccount(ledgerId, name);
  };
};
