import { describe, expect, test } from "vitest";
import { v4 as uuid } from "uuid";
import { Money } from "../../src/money/Money.js";
import { InMemoryLedgerStorage } from "../../src/ledger/storage/InMemoryStorage.js";
import { CustomLedger } from "../customLedger/CustomLedger.js";

describe("ProjectStartedOperation", () => {
  const ledgerId = uuid();
  const storage = new InMemoryLedgerStorage();
  const ledger = new CustomLedger(ledgerId, storage);

  test("records ProjectStartedOperation", async () => {
    const transaction = await ledger.record({
      targetNetAmount: new Money(100, "USD"),
      platformFee: new Money(10, "USD"),
      amountLockedForCustomer: new Money(50, "USD"),
      paymentProcessingFee: new Money(5, "USD"),
      clientUserId: 1,
      customerUserId: 2,
    });

    // await ledger.record(operation);
    expect(true).toBe(true);
  });
});
