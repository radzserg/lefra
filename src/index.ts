import { CreditOperations, Entry } from "./ledger/operations/Entry";
import { debit } from "./ledger/operations/DebitOperation";
import { credit } from "./ledger/operations/CreditOperation";
import { account } from "./ledger/accounts/LedgerAccount";
import { Money } from "./money/Money";

console.log("Hello World");

const newOperation = new Entry(
  debit(account("Receivables", 1), new Money(100, "USD")),
  new CreditOperations([
    credit(account("Expenses: Stripe"), new Money(70, "USD")),
    credit(account("Expenses: Stripe"), new Money(30, "USD")),
  ]),
);

console.log(newOperation);
