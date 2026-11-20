"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HeartIcon, ShoppingBagIcon, StoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import { clearBuyNowDraft, saveBuyNowDraft } from "@/lib/mock/checkout";
import type { ResolvedShopContext, ResolvedVariant } from "@/lib/mock/pdp";
import { useWishlistActionGate } from "@/lib/prototype/useWishlistActionGate";
import { getShopIdForProduct } from "@/lib/store/shared/resolve";
import { useSharedStore, useSharedStoreActions } from "@/lib/store/shared/hooks";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

type Labels = {
  price: string;
  compareAt: string;
  availability: string;
  sku: string;
  variants: string;
  selectedOption: string;
  shopContext: string;
  shopLabel: string;
  addToCart: string;
  addedToCart: string;
  buyNow: string;
  buyNowHint: string;
  addToWishlist: string;
  addedToWishlist: string;
  proceedToCheckout: string;
  continueBrowsing: string;
  unavailableAction: string;
  unavailableMessage: string;
  quantityLabel: string;
  quantityNote: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
};

export function ProductPurchasePanel({
  locale,
  productId,
  variants,
  selectedVariantId,
  shop,
  labels,
}: {
  locale: Locale;
  productId: string;
  variants: ResolvedVariant[];
  selectedVariantId: string | null;
  shop: ResolvedShopContext | null;
  labels: Labels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);
  const actions = useSharedStoreActions();
  const { run, gate } = useWishlistActionGate();
  const variantId = useMemo(() => {
    if (variants.length === 0) return null;
    return (variants.find((v) => v.id === selectedVariantId) ?? variants[0]).id;
  }, [variants, selectedVariantId]);
  const shopId = shop?.shopId ?? getShopIdForProduct(productId, variantId);
  const wishlisted = useSharedStore((state) =>
    state.wishlistLines.some((line) => line.productId === productId && line.variantId === variantId),
  );

  const selected = useMemo(() => {
    if (variants.length === 0) return null;
    return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  }, [variants, selectedVariantId]);

  function flash(text: string) {
    setMsg(text);
    window.setTimeout(() => setMsg((m) => (m === text ? null : m)), 1800);
  }

  function buyNow() {
    saveBuyNowDraft({ productId, variantId, shopId, quantity: 1 });
    router.push(withLocale(locale, "/checkout"));
  }

  function onSelectVariant(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const unavailable = selected?.availability === "out_of_stock";
  const hasCompare = !!selected?.compareAtPriceBdt && selected.compareAtPriceBdt > selected.priceBdt;
  const availText =
    selected?.stockStateLabel
      ? pickText(selected.stockStateLabel, locale)
      : selected?.availability === "in_stock"
        ? labels.inStock
        : selected?.availability === "low_stock"
          ? labels.lowStock
          : labels.outOfStock;

  return (
    <div className="space-y-6">
      {variants.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{labels.variants}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={labels.variants}>
            {variants.map((v) => {
              const active = v.id === selected?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active ? "border-primary bg-primary/5 font-medium" : "hover:border-foreground/20",
                  )}
                  aria-pressed={active}
                >
                  {pickText(v.title, locale)}
                </button>
              );
            })}
          </div>
          {selected ? (
            <p className="text-xs text-muted-foreground">
              {labels.selectedOption}: {pickText(selected.title, locale)}
            </p>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{formatPrice(BigInt(selected.priceBdt), locale)}</p>
            {hasCompare ? (
              <p className="text-base text-muted-foreground line-through">
                <span className="sr-only">{labels.compareAt}: </span>
                {formatPrice(BigInt(selected.compareAtPriceBdt as number), locale)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={selected.availability === "out_of_stock" ? "destructive" : selected.availability === "low_stock" ? "secondary" : "outline"}>
              {availText}
            </Badge>
            {selected.sku ? (
              <span className="text-xs text-muted-foreground">
                {labels.sku}: {selected.sku}
              </span>
            ) : null}
          </div>
          {unavailable ? (
            <p className="text-sm text-muted-foreground">{labels.unavailableMessage}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={unavailable}
            onClick={() => {
              actions.addToCart({ productId, variantId, shopId, quantity: 1 });
              flash(labels.addedToCart);
            }}
          >
            <ShoppingBagIcon className="size-4" aria-hidden="true" />
            {unavailable ? labels.unavailableAction : labels.addToCart}
          </Button>
          <Button type="button" variant="secondary" size="lg" className="flex-1" disabled={unavailable} onClick={buyNow}>
            {labels.buyNow}
          </Button>
          <Button
            type="button"
            variant={wishlisted ? "secondary" : "outline"}
            size="lg"
            aria-pressed={wishlisted}
            onClick={() =>
              run(() => {
                if (!wishlisted) {
                  actions.addToWishlist({ productId, variantId, shopId });
                  flash(labels.addedToWishlist);
                }
              })
            }
          >
            <HeartIcon className={cn("size-4", wishlisted && "fill-current")} aria-hidden="true" />
            {wishlisted ? labels.addedToWishlist : labels.addToWishlist}
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={withLocale(locale, "/checkout")}
            onClick={() => clearBuyNowDraft()}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              unavailable && "pointer-events-none opacity-50",
            )}
            aria-disabled={unavailable || undefined}
            tabIndex={unavailable ? -1 : undefined}
          >
            {labels.proceedToCheckout}
          </Link>
          <Link
            href={withLocale(locale, "/search")}
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {labels.continueBrowsing}
          </Link>
        </div>
        {msg ? (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {msg}
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">{labels.buyNowHint}</p>
        <p className="text-xs text-muted-foreground">
          {labels.quantityLabel}: 1 ({labels.quantityNote})
        </p>
      </div>

      {shop ? (
        <div className="rounded-xl border bg-card/50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <StoreIcon className="size-4" aria-hidden="true" />
            {labels.shopContext}
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">{labels.shopLabel}: </span>
              <span className="font-medium">{pickText(shop.label, locale)}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(shop.badges ?? []).map((b, i) => (
                <Badge key={`${b.en}-${i}`} variant={shop.isCareU ? "default" : "secondary"} className="text-xs">
                  {pickText(b, locale)}
                </Badge>
              ))}
            </div>
            {(shop.trustCues ?? []).length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {(shop.trustCues ?? []).map((cue, i) => (
                  <li key={`${cue.en}-${i}`}>{pickText(cue, locale)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      {gate}
    </div>
  );
}
