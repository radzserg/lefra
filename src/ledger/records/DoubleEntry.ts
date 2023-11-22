import { CreditEntry, DebitEntry, UniformEntrySet } from "./Entry";
import { NonEmptyArray } from "../../types";
import { LedgerError } from "../../errors";

/**
 * Represents double-entry bookkeeping entry.
 */
export class DoubleEntry {
  private readonly _debitEntries: UniformEntrySet<DebitEntry>;
  private readonly _creditEntries: UniformEntrySet<CreditEntry>;

  public constructor(
    debitEntries: DebitEntry | NonEmptyArray<DebitEntry>,
    creditEntries: CreditEntry | NonEmptyArray<CreditEntry>,
    public readonly comment: string | null = null,
  ) {
    this._debitEntries = UniformEntrySet.build(debitEntries);
    this._creditEntries = UniformEntrySet.build(creditEntries);

    const debitSum = this._debitEntries.sum();
    const creditSum = this._creditEntries.sum();
    if (!debitSum.equals(creditSum)) {
      throw new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: ${debitSum.format()}, credit sum: ${creditSum.format()}`,
      );
    }
  }

  public get debitEntries(): NonEmptyArray<DebitEntry> {
    return this._debitEntries.entries();
  }

  public get creditEntries(): NonEmptyArray<CreditEntry> {
    return this._creditEntries.entries();
  }
}
