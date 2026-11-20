import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { CheckoutView } from "@/components/storefront/checkout/CheckoutView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Navigable prototype checkout placeholder for signed in mock customers. */
export default async function CheckoutPage() {
  const locale = (await getLocale()) as Locale;

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <CheckoutView locale={locale} />
    </ProtectedPrototypePage>
  );
}
