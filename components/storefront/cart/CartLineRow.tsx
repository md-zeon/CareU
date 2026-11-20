"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type { ResolvedLine } from "@/lib/store/shared/resolve";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { QuantityControl } from "@/components/storefront/shared/QuantityControl";
import { cn } from "@/lib/utils";

export type CartLineLabels = {
  quantityLabel: string;
  decrease: string;
  increase: string;
  remove: string;
  saveForLater: string;
  moveToWishlist: string;
  unavailable: string;
  unavailableHint: string;
  maxQuantity: string;
  shopLabel: string;
  careuShop: string;
  marketplaceSeller: string;
};

export function CartLineRow({
  line,
  locale,
  labels,
  onToggleSelected,
  onQuantity,
  onRemove,
  onSaveForLater,
  onMoveToWishlist,
}: {
  line: ResolvedLine;
  locale: Locale;
  labels: CartLineLabels;
  onToggleSelected: () => void;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
  onMoveToWishlist: () => void;
}) {
  const shopTypeLabel = line.shopType === "careu" ? labels.careuShop : labels.marketplaceSeller;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4 sm:gap-4 sm:px-5",
        !line.isAvailable && "bg-muted/30",
      )}
    >
      <input
        type="checkbox"
        checked={line.selected}
        disabled={!line.isAvailable}
        onChange={onToggleSelected}
        aria-label={pickText(line.title, locale)}
        className="mt-1 size-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
      />

      <Link
        href={withLocale(locale, line.href)}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-24"
      >
        <Image src={line.image} alt={pickText(line.title, locale)} fill sizes="96px" className="object-cover" />
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <Link
            href={withLocale(locale, line.href)}
            className="line-clamp-2 text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
          >
            {pickText(line.title, locale)}
          </Link>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {line.variantTitle ? <span>{pickText(line.variantTitle, locale)}</span> : null}
            {line.sku ? <span>· {line.sku}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {labels.shopLabel}:{" "}
            <Link href={withLocale(locale, line.shopHref)} className="hover:underline">
              {pickText(line.shopName, locale)}
            </Link>{" "}
            <span className="text-[11px]">({shopTypeLabel})</span>
          </p>
        </div>

        {!line.isAvailable ? (
          <div className="space-y-1">
            <Badge variant="destructive">{labels.unavailable}</Badge>
            <p className="text-xs text-muted-foreground">{labels.unavailableHint}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{labels.quantityLabel}</span>
          <QuantityControl
            value={line.quantity}
            max={line.maxQuantity}
            decreaseLabel={labels.decrease}
            increaseLabel={labels.increase}
            onChange={onQuantity}
          />
          <span className="text-[11px] text-muted-foreground">
            {labels.maxQuantity.replace("{count}", String(line.maxQuantity))}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onSaveForLater}>
            {labels.saveForLater}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onMoveToWishlist}>
            <HeartIcon className="size-3.5" aria-hidden="true" />
            {labels.moveToWishlist}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2Icon className="size-3.5" aria-hidden="true" />
            {labels.remove}
          </Button>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold sm:text-base">{formatPrice(BigInt(line.lineTotalBdt), locale)}</p>
        {line.quantity > 1 ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatPrice(BigInt(line.unitPriceBdt), locale)} × {line.quantity}
          </p>
        ) : null}
      </div>
    </div>
  );
}
