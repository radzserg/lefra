import { LedgerAccount } from "./LedgerAccount";

export class SystemLedgerAccount implements LedgerAccount {
  public constructor(private readonly name: string) {}
}
