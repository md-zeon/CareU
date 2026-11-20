import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { CartView } from "@/components/storefront/cart/CartView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Guest-friendly prototype bag backed by the shared browser store. */
export default async function CartPage() {
  const locale = (await getLocale()) as Locale;
  return <CartView locale={locale} />;
}
