import { UserLedgerAccount } from "./ledger/accounts/UserLedgerAccount";
import { SystemLedgerAccount } from "./ledger/accounts/SystemLedgerAccount";

/**
 * Shorthand to create ledger account
 */
export const account = (name: string, id?: number) => {
  if (id) {
    return new UserLedgerAccount(name, id);
  }
  return new SystemLedgerAccount(name);
};
