import { describe, expect, test } from "vitest";
import { Entry } from "./Entry";
import { credit, debit } from "./Operations";
import { account } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";

describe("Ledger entry", () => {
  test("debit and credit operations must have the same money amount", () => {
    expect(() => {
      new Entry(
        debit(account("Receivables", 1), new Money(100, "USD")),
        credit(account("Expenses"), new Money(100, "USD")),
      );
    }).not.toThrow();
  });

  test("throw an error if debit and credit operations amount are not equal", () => {
    expect(() => {
      new Entry(
        debit(account("Receivables", 1), new Money(100, "USD")),
        credit(account("Expenses"), new Money(70, "USD")),
      );
    }).toThrow(
      new LedgerError(
        `Debit and credit operations must have the same money amount. Debit sum: $100.00, credit sum: $70.00`,
      ),
    );
  });
});
