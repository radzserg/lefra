import { describe, expect, test } from "vitest";

import { Money } from "../../money/Money";
import { Transaction } from "../records/Transaction";
import { Entry } from "../records/Entry";
import { credit, debit } from "../records/Operations";
import { InMemoryLedgerStorage } from "./InMemoryStorage";
import { createAccountFactory } from "../../index";
import { v4 as uuid } from "uuid";

const ledgerId = uuid();
const account = createAccountFactory(ledgerId);

describe("InMemoryLedgerStorage", () => {
  describe("save accounts", () => {
    test("save accounts", async () => {
      const storage = new InMemoryLedgerStorage();
      await storage.saveAccounts([
        account("INCOME_PAID_PROJECTS"),
        account("INCOME_PAYMENT_FEE"),
        account("PAYABLES_LOCKED", 1),
      ]);

      const savedAccounts = await storage.findAccounts();

      expect(savedAccounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            canBeInserted: false,
            ledgerId,
            name: "INCOME_PAID_PROJECTS",
          }),
          expect.objectContaining({
            id: expect.any(String),
            canBeInserted: false,
            ledgerId,
            name: "INCOME_PAYMENT_FEE",
          }),
          expect.objectContaining({
            id: expect.any(String),
            canBeInserted: false,
            ledgerId,
            name: "INCOME_PAYMENT_FEE",
          }),
        ]),
      );
    });

    test("cannot override existing system", async () => {
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account("INCOME_PAID_PROJECTS");
      await storage.saveAccounts([originalAccount]);

      await expect(async () => {
        await storage.saveAccounts([account("INCOME_PAID_PROJECTS")]);
      }).rejects.toThrow(
        `Account ${ledgerId}:INCOME_PAID_PROJECTS cannot be inserted`,
      );
    });

    test("cannot override existing user account", async () => {
      const storage = new InMemoryLedgerStorage();
      const originalAccount = account("RECEIVABLES", 1);
      await storage.saveAccounts([originalAccount]);
      await storage.saveAccounts([account("RECEIVABLES", 1)]);

      const savedAccounts = await storage.findAccounts();
      expect(savedAccounts).toEqual([originalAccount]);
    });
  });

  test("save transactions", async () => {
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

    // await storage.saveTransaction(transaction);
  });
});
