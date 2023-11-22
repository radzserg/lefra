import { describe, expect, test } from "vitest";
import { Transaction } from "./Transaction";
import { DoubleEntry } from "./DoubleEntry";
import { credit, debit } from "./Entry";

import { Money } from "../../money/Money";
import { createAccountFactory } from "../../index";
import { v4 as uuid } from "uuid";

const ledgerId = uuid();
const account = createAccountFactory(ledgerId);

describe("Transaction", () => {
  test("create a transaction", () => {
    new Transaction([
      new DoubleEntry(
        debit(account("RECEIVABLES", 1), new Money(100, "USD")),
        credit(account("INCOME_PAID_PROJECTS"), new Money(100, "USD")),
        "User owes money for goods",
      ),
      new DoubleEntry(
        debit(account("RECEIVABLES", 1), new Money(3, "USD")),
        credit(account("INCOME_PAYMENT_FEE"), new Money(3, "USD")),
        "User owes payment processing fee",
      ),
    ]);
  });

  test("transaction is is assigned to all operations", () => {
    const entries = [
      debit(account("RECEIVABLES", 1), new Money(100, "USD")),
      credit(account("INCOME_PAID_PROJECTS"), new Money(100, "USD")),
      debit(account("RECEIVABLES", 1), new Money(3, "USD")),
      credit(account("INCOME_PAYMENT_FEE"), new Money(3, "USD")),
    ];
    const transaction = new Transaction([
      new DoubleEntry(entries[0], entries[1]),
      new DoubleEntry(entries[2], entries[3]),
    ]);

    for (const operation of entries) {
      expect(operation.transactionId).toEqual(transaction.id);
    }

    expect(transaction.entries).toEqual(entries);
  });
});
