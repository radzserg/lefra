import { UserLedgerAccount } from "./ledger/accounts/UserLedgerAccount.js";
import { SystemLedgerAccount } from "./ledger/accounts/SystemLedgerAccount.js";

/**
 * Shorthand to create ledger account
 */
export const account = (name: string, id?: number | string) => {
  if (id) {
    return new UserLedgerAccount(name, id);
  }
  return new SystemLedgerAccount(name);
};
