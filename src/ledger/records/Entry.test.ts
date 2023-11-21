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

  test("create an entry with a comment", () => {
    const debitOperation = debit(
      account("USER_RECEIVABLES", 1),
      new Money(100, "USD"),
    );
    const creditOperation = credit(
      account("INCOME_GOODS"),
      new Money(100, "USD"),
    );
    const entry = new Entry(
      debitOperation,
      creditOperation,
      "User owes money for goods",
    );
    expect(entry.debitOperations()).toEqual([debitOperation]);
    expect(entry.creditOperations()).toEqual([creditOperation]);
    expect(entry.comment).toEqual("User owes money for goods");
  });

  test("create an entry with divided credit operation", () => {
    const debitOperation = debit(
      account("EXPENSES_PAYOUTS", 1),
      new Money(100, "USD"),
    );
    const creditPayablesLocked = credit(
      account("PAYABLES_LOCKED"),
      new Money(70, "USD"),
    );
    const creditPayables = credit(
      account("PAYABLES_LOCKED"),
      new Money(30, "USD"),
    );
    const entry = new Entry(
      debitOperation,
      [creditPayablesLocked, creditPayables],
      "Platform owes $30.00 to the contractor and and owes $70.00 but it is locked",
    );

    expect(entry.debitOperations()).toEqual([debitOperation]);
    expect(entry.creditOperations()).toEqual([
      creditPayablesLocked,
      creditPayables,
    ]);
    expect(entry.comment).toEqual(
      "Platform owes $30.00 to the contractor and and owes $70.00 but it is locked",
    );
  });
});
