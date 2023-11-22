import { describe, expect, test } from "vitest";

import { account } from "../accounts/LedgerAccount";
import { Money } from "../../money/Money";
import { Transaction } from "../records/Transaction";
import { Entry } from "../records/Entry";
import { credit, debit } from "../records/Operations";
import { InMemoryLedgerStorage } from "./InMemoryStorage";

describe("InMemoryLedgerStorage", () => {
  test("create a transaction", async () => {
    const storage = new InMemoryLedgerStorage();

    const transaction = new Transaction([
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

    await storage.saveTransaction(transaction);
  });
});
