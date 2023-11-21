import { CreditOperation, DebitOperation } from "./Operations";

/**
 * Represents double-entry bookkeeping entry.
 */
export class Entry {
  public constructor(
    private readonly debit: DebitOperation | DebitOperation[],
    private readonly credit: CreditOperation | CreditOperation[],
    private readonly comment?: string,
  ) {}
}
