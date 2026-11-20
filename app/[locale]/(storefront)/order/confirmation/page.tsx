import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { OrderConfirmationView } from "@/components/storefront/checkout/OrderConfirmationView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Refreshable local confirmation for the last mock order. */
export default async function OrderConfirmationPage() {
  const locale = (await getLocale()) as Locale;

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <OrderConfirmationView locale={locale} />
    </ProtectedPrototypePage>
  );
}
