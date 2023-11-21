import { LedgerAccount } from "./LedgerAccount";

export class SystemLedgerAccount implements LedgerAccount {
  public constructor(
    private readonly ledgerId: string,
    private readonly name: string,
  ) {}
}
