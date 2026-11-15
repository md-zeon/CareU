import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type { ResolvedProductCard } from "@/lib/mock/browse";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { BrowseQuickActions } from "./BrowseQuickActions";

export function BrowseProductCard({
  card,
  locale,
  labels,
}: {
  card: ResolvedProductCard;
  locale: Locale;
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
  const hasCompare = typeof card.compareAtPriceBdt === "number" && card.compareAtPriceBdt > card.priceBdt;
  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={withLocale(locale, card.href)} className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <div className="relative aspect-square bg-muted">
          <Image
            src={card.image}
            alt={pickText(card.imageAlt ?? card.title, locale)}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          {(card.availabilityLabel || card.badges.length > 0) ? (
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {card.availabilityLabel ? (
                <Badge variant={card.availability === "out_of_stock" ? "destructive" : "secondary"}>
                  {pickText(card.availabilityLabel, locale)}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
              {card.shopType === "careu" ? labels.fromCareu : labels.fromSeller}
            </span>
            <span>{pickText(card.shopLabel, locale)}</span>
            {card.brandLabel ? <span>· {pickText(card.brandLabel, locale)}</span> : null}
          </div>
          <Link href={withLocale(locale, card.href)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <h3 className="line-clamp-2 text-base font-semibold leading-6">{pickText(card.title, locale)}</h3>
          </Link>
          {card.badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {card.badges.map((b, i) => (
                <Badge key={`${b.en}-${i}`} variant="outline" className="text-xs">
                  {pickText(b, locale)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-lg font-semibold">{formatPrice(BigInt(card.priceBdt), locale)}</p>
            {hasCompare ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(BigInt(card.compareAtPriceBdt as number), locale)}
              </p>
            ) : null}
          </div>
          {typeof card.rating === "number" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground">
                <StarIcon className="size-4 fill-current" aria-hidden="true" />
                <span className="font-medium">{card.rating.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 })}</span>
              </span>
              <span className="sr-only">{labels.rating}</span>
              {typeof card.reviewCount === "number" ? (
                <span>
                  ({card.reviewCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {labels.reviews})
                </span>
              ) : null}
            </div>
          ) : null}
          <BrowseQuickActions
            wishlistLabel={labels.wishlist}
            cartLabel={labels.cart}
            wishlistAddedLabel={labels.wishlistAdded}
            cartAddedLabel={labels.cartAdded}
          />
        </div>
      </div>
    </li>
  );
}
