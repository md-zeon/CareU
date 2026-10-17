import type { Locale } from "@/lib/i18n/routing";

/**
 * Format an integer BDT amount for display.
 * Money is always an integer in BDT (see AGENTS.md) — never a float.
 */
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}
