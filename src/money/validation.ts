import { z } from "zod";
import { Money } from "./Money.js";

export const moneySchema = z.custom<Money>((value) => {
  return value instanceof Money;
});

export const usdSchema = z.custom<Money<"USD">>((value) => {
  return value instanceof Money && value.currencyCode === "USD";
});
