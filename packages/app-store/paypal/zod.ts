import { z } from "zod";

import { eventTypeAppCardZod } from "@calcom/app-store/eventTypeAppCardZod";
import { currencyOptions } from "@calcom/app-store/paypal/lib/currencyOptions";

const paymentOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const paymentOptionsSchema = z.array(paymentOptionSchema);

export const PaypalPaymentOptions = [
  {
    label: "on_booking_option",
    value: "ON_BOOKING",
  },
  // @TODO: not required right now
  // {
  //   label: "hold_option",
  //   value: "HOLD",
  // },
];

type PaymentOption = (typeof PaypalPaymentOptions)[number]["value"];
const VALUES: [PaymentOption, ...PaymentOption[]] = [
  PaypalPaymentOptions[0].value,
  ...PaypalPaymentOptions.slice(1).map((option) => option.value),
];
export const paymentOptionEnum = z.enum(VALUES);

export const defaultCurrency = currencyOptions[0].value;

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    price: z.number(),
    currency: z.string().default(defaultCurrency),
    paymentOption: z.string().optional(),
    enabled: z.boolean().optional(),
  })
);
export const appKeysSchema = z.object({});
