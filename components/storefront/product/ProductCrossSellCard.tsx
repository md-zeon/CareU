import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type { CrossSellItem } from "@/lib/mock/pdp";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";

export function ProductCrossSellCard({
  item,
  locale,
  shopLabels,
}: {
  item: CrossSellItem;
  locale: Locale;
  shopLabels: { careu: string; seller: string };
}) {
  const hasCompare = typeof item.compareAtPriceBdt === "number" && item.compareAtPriceBdt > item.priceBdt;
  return (
    <li className="min-w-[220px] max-w-[260px] snap-start">
      <Link
        href={withLocale(locale, item.href)}
        className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative aspect-[4/3] bg-muted">
          <Image src={item.image} alt={pickText(item.imageAlt, locale)} fill sizes="240px" className="object-cover" />
          {item.badge ? (
            <div className="absolute left-2 top-2">
              <Badge variant="secondary" className="text-xs">{pickText(item.badge, locale)}</Badge>
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <p className="text-xs text-muted-foreground">
            {item.isCareU ? shopLabels.careu : shopLabels.seller} · {pickText(item.shopLabel, locale)}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6">{pickText(item.title, locale)}</h3>
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-sm font-semibold">{formatPrice(BigInt(item.priceBdt), locale)}</p>
            {hasCompare ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(BigInt(item.compareAtPriceBdt as number), locale)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
