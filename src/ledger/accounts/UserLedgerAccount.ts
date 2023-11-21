import { LedgerAccount } from "./LedgerAccount";

export class UserLedgerAccount implements LedgerAccount {
  public constructor(
    private readonly name: string,
    private readonly id: number,
  ) {}
}
