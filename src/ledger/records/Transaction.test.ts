import { describe, expect, test } from "vitest";
import { Transaction } from "./Transaction";
import { Entry } from "./Entry";
import { credit, debit } from "./Operations";

import { Money } from "../../money/Money";
import { createAccountFactory } from "../../index";
import { v4 as uuid } from "uuid";

const ledgerId = uuid();
const account = createAccountFactory(ledgerId);

describe("Transaction", () => {
  test("create a transaction", () => {
    new Transaction([
      new Entry(
        debit(account("RECEIVABLES", 1), new Money(100, "USD")),
        credit(account("INCOME_PAID_PROJECTS"), new Money(100, "USD")),
        "User owes money for goods",
      ),
      new Entry(
        debit(account("RECEIVABLES", 1), new Money(3, "USD")),
        credit(account("INCOME_PAYMENT_FEE"), new Money(3, "USD")),
        "User owes payment processing fee",
      ),
    ]);
  });

  test("transaction is is assigned to all operations", () => {
    const operations = [
      debit(account("RECEIVABLES", 1), new Money(100, "USD")),
      credit(account("INCOME_PAID_PROJECTS"), new Money(100, "USD")),
      debit(account("RECEIVABLES", 1), new Money(3, "USD")),
      credit(account("INCOME_PAYMENT_FEE"), new Money(3, "USD")),
    ];
    const transaction = new Transaction([
      new Entry(operations[0], operations[1]),
      new Entry(operations[2], operations[3]),
    ]);

    for (const operation of operations) {
      expect(operation.transactionId).toEqual(transaction.id);
    }

    expect(transaction.operations).toEqual(operations);
  });
});
