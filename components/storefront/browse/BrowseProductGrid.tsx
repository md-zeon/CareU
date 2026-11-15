import type { Locale } from "@/lib/i18n/routing";
import type { ResolvedProductCard } from "@/lib/mock/browse";
import { BrowseProductCard } from "./BrowseProductCard";

export function BrowseProductGrid({
  items,
  locale,
  labels,
  gridLabel,
}: {
  items: ResolvedProductCard[];
  locale: Locale;
  gridLabel: string;
  labels: {
    wishlist: string;
    cart: string;
    wishlistAdded: string;
    cartAdded: string;
    fromCareu: string;
    fromSeller: string;
    rating: string;
    reviews: string;
  };
}) {
  return (
    <ul aria-label={gridLabel} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((card) => (
        <BrowseProductCard key={`${card.productId}-${card.listingId ?? card.variantId ?? "rep"}`} card={card} locale={locale} labels={labels} />
      ))}
    </ul>
  );
}
