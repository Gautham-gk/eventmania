// ─────────────────────────────────────────────────────────────────────────────
//  THE price formatter. Every surface that renders money imports from here.
//
//  Why this file exists: prices used to be formatted at each call site, and the
//  call sites drifted — the home/explore cards rendered ₹ while the event page,
//  checkout, dashboard, organiser console and share images all hardcoded $. The
//  same event showed two different currencies depending on where you looked.
//
//  Rules:
//   • Never hand-write a currency symbol in a component. Import formatPrice.
//   • Always pass the event's own `currency`. Omitting it falls back to the
//     platform default (INR) — correct for native events, WRONG for anything
//     synced from Ticketmaster, which carries real USD/GBP/EUR amounts.
//   • Free is a price of 0 and reads as "Free" — no symbol, in any currency.
//
//  No `window` / DOM access here — safe to import on both server and client
//  (the Open Graph and story image routes render server-side).
// ─────────────────────────────────────────────────────────────────────────────

import { CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@eventmind/types";

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Resolve a possibly-absent / unknown code to a currency we can render. */
function resolve(code?: string | null) {
  return BY_CODE.get((code ?? "").toUpperCase() as CurrencyCode)
    ?? BY_CODE.get(DEFAULT_CURRENCY)!;
}

/** The bare symbol — for input prefixes and other non-numeric slots. */
export function currencySymbol(code?: string | null): string {
  return resolve(code).symbol;
}

export interface FormatPriceOptions {
  /** Show minor units ("₹1,200.00"). Default false — most surfaces want whole
   *  numbers; checkout opts in because it sums a fee and must reconcile. */
  decimals?: boolean;
  /** Label for a price of 0. Pass null to format 0 as a normal amount. */
  freeLabel?: string | null;
}

/**
 * Format an amount in the given currency: "₹1,200", "$45.00", "Free".
 *
 * Grouping follows the currency's own locale, so INR gets the lakh/crore
 * grouping (₹1,20,000) rather than a thousands split — that was the one thing
 * the old card adapter got right, and it survives here.
 */
export function formatPrice(
  amount: number,
  code?: string | null,
  { decimals = false, freeLabel = "Free" }: FormatPriceOptions = {},
): string {
  if (amount === 0 && freeLabel !== null) return freeLabel;

  const currency = resolve(code);
  const digits = decimals ? 2 : 0;
  const formatted = amount.toLocaleString(currency.locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${currency.symbol}${formatted}`;
}

/** Convenience for anything holding a whole event. */
export function formatEventPrice(
  event: { price: number; currency?: string | null },
  options?: FormatPriceOptions,
): string {
  return formatPrice(event.price, event.currency, options);
}

/**
 * ISO code a payment processor expects (Stripe wants lower case).
 * Use this instead of hardcoding "usd" at a checkout call site.
 */
export function paymentCurrency(code?: string | null): string {
  return resolve(code).code.toLowerCase();
}
