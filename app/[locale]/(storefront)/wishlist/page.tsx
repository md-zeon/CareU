import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { WishlistView } from "@/components/storefront/wishlist/WishlistView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Wishlist stays behind the prototype customer sign in gate. */
export default async function WishlistPage() {
  const locale = (await getLocale()) as Locale;

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <WishlistView locale={locale} />
    </ProtectedPrototypePage>
  );
}
