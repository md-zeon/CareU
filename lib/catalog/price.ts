import type { Locale } from "@/lib/i18n/routing";
import { type Poisha, POISHA_PER_BDT } from "@/lib/money/poisha";

/**
 * Format an integer money amount for display.
 *
 * Money is always an integer in **poisha** (1 BDT = 100 poisha), stored as
 * `bigint` — never a float, never a `Decimal` (see AGENTS.md and
 * docs/data-model.md D-06). Amounts below one taka are rendered with their
 * paisa, so the displayed value is always the exact value.
 *
 * Exactness: a poisha amount has at most two decimal digits in BDT, so
 * rounding the double back to two fraction digits can never land on a
 * half-way boundary (there is no third decimal to carry). For any amount
 * inside the safe-integer range the displayed value is therefore exactly the
 * stored value. Amounts beyond that range are rejected rather than shown
 * rounded.
 */
export function formatPrice(amount: Poisha, locale: Locale): string {
  const value = Number(amount);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`formatPrice: amount ${amount} is too large to format`);
  }
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / Number(POISHA_PER_BDT));
}
