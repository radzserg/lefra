import { describe, expect, test } from "vitest";
import { credit, debit, UniformOperationsSet } from "./Operations";
import { account } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";
import { v4 as uuid } from "uuid";

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
    const operation = debit(account("Receivables", 1), new Money(100, "USD"));
    const operationsSet = UniformOperationsSet.build(operation);
    expect(operationsSet.operations()).toEqual([operation]);
    expect(operation.id).toBeTypeOf("string");
  });

  test("create UniformOperations from one credit operation", () => {
    const operation = credit(account("Receivables", 1), new Money(100, "USD"));
    const operationsSet = UniformOperationsSet.build(operation);
    expect(operationsSet.operations()).toEqual([operation]);
    expect(operation.id).toBeTypeOf("string");
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

  test("cannot override operation transaction id", () => {
    const operation = debit(account("Receivables", 1), new Money(0, "USD"));
    const originalTransactionId = uuid();
    operation.transactionId = originalTransactionId;
    expect(() => {
      operation.transactionId = uuid();
    }).toThrow(
      new LedgerError("Operation is already attached to a transaction"),
    );
    expect(operation.transactionId).toEqual(originalTransactionId);
  });
});
