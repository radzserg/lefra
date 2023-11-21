import { describe, expect, test } from "vitest";
import { credit, debit, UniformOperationsSet } from "./Operations";
import { account } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";

describe("UniformOperations", () => {
  test("cannot create UniformOperations with different operation types", () => {
    expect(() => {
      UniformOperationsSet.build([
        // @ts-ignore
        debit(account("Receivables", 1), new Money(100, "USD")),
        credit(account("Expenses"), new Money(100, "USD")),
      ]);
    }).toThrow(new LedgerError("All operations must be of the same type"));
  });

  test("cannot create UniformOperations with different currency codes", () => {
    expect(() => {
      UniformOperationsSet.build([
        credit(account("Receivables", 1), new Money(100, "CAD")),
        credit(account("Expenses"), new Money(100, "USD")),
      ]);
    }).toThrow(new LedgerError("All operations must be of the same currency"));
  });

  test("cannot create UniformOperations with empty operations", () => {
    expect(() => {
      UniformOperationsSet.build(
        // @ts-ignore
        [],
      );
    }).toThrow(new LedgerError("Operations array must not be empty"));
  });

  test("create UniformOperations from one debit operation", () => {
    const operationsSet = UniformOperationsSet.build(
      debit(account("Receivables", 1), new Money(100, "USD")),
    );
    expect(operationsSet.operations()).toEqual([
      debit(account("Receivables", 1), new Money(100, "USD")),
    ]);
  });

  test("create UniformOperations from one credit operation", () => {
    const operationsSet = UniformOperationsSet.build(
      credit(account("Receivables", 1), new Money(100, "USD")),
    );
    expect(operationsSet.operations()).toEqual([
      credit(account("Receivables", 1), new Money(100, "USD")),
    ]);
  });

  test("cannot have zero sum of operations", () => {
    expect(() => {
      UniformOperationsSet.build([
        debit(account("Receivables", 1), new Money(0, "USD")),
      ]);
    }).toThrow(new LedgerError("Operations must not sum to zero"));

    expect(() => {
      UniformOperationsSet.build([
        debit(account("Receivables", 1), new Money(0, "USD")),
        debit(account("Receivables", 1), new Money(0, "USD")),
      ]);
    }).toThrow(new LedgerError("Operations must not sum to zero"));
  });
});
