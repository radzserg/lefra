import { UserLedgerAccount } from "./ledger/accounts/UserLedgerAccount";
import { SystemLedgerAccount } from "./ledger/accounts/SystemLedgerAccount";
import { LedgerAccount } from "./ledger/accounts/LedgerAccount";

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
