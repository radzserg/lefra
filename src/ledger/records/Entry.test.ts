import { describe, expect, test } from "vitest";
import { credit, debit, UniformEntrySet } from "./Entry";
import { Money } from "../../money/Money";
import { LedgerError } from "../../errors";
import { v4 as uuid } from "uuid";
import { createAccountFactory } from "../../index";

const ledgerId = uuid();
const account = createAccountFactory(ledgerId);

describe("UniformEntrySet", () => {
  test("cannot create UniformEntrySet with different operation types", () => {
    expect(() => {
      UniformEntrySet.build([
        // @ts-ignore
        debit(account("Receivables", 1), new Money(100, "USD")),
        credit(account("Expenses"), new Money(100, "USD")),
      ]);
    }).toThrow(new LedgerError("All operations must be of the same type"));
  });

  test("cannot create UniformEntrySet with different currency codes", () => {
    expect(() => {
      UniformEntrySet.build([
        credit(account("Receivables", 1), new Money(100, "CAD")),
        credit(account("Expenses"), new Money(100, "USD")),
      ]);
    }).toThrow(new LedgerError("All operations must be of the same currency"));
  });

  test("cannot create UniformEntrySet with empty operations", () => {
    expect(() => {
      UniformEntrySet.build(
        // @ts-ignore
        [],
      );
    }).toThrow(new LedgerError("Operations array must not be empty"));
  });

  test("create UniformEntrySet from one debit operation", () => {
    const entry = debit(account("Receivables", 1), new Money(100, "USD"));
    const entries = UniformEntrySet.build(entry);
    expect(entries.entries()).toEqual([entry]);
    expect(entry.id).toBeTypeOf("string");
  });

  test("create UniformEntrySet from one credit operation", () => {
    const entry = credit(account("Receivables", 1), new Money(100, "USD"));
    const entries = UniformEntrySet.build(entry);
    expect(entries.entries()).toEqual([entry]);
    expect(entry.id).toBeTypeOf("string");
  });

  test("cannot have zero sum of operations", () => {
    expect(() => {
      UniformEntrySet.build([
        debit(account("Receivables", 1), new Money(0, "USD")),
      ]);
    }).toThrow(new LedgerError("Operations must not sum to zero"));

    expect(() => {
      UniformEntrySet.build([
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
