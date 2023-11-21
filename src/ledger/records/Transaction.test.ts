import { describe, expect, test } from "vitest";
import { Transaction } from "./Transaction";
import { Entry } from "./Entry";
import { credit, debit } from "./Operations";
import { account } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";

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
});
