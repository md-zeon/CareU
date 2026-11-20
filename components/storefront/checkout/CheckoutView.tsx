"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import { groupCartLines, resolveLines, summarizeCart } from "@/lib/store/shared/resolve";
import { useSharedStore, useSharedStoreHydrated } from "@/lib/store/shared/hooks";
import { CardContent, CardHeader, CardShell, DetailShell, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, LoadingState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";

export function CheckoutView({ locale }: { locale: Locale }) {
  const t = useTranslations("Checkout");
  const hydrated = useSharedStoreHydrated();
  const checkoutLineIds = useSharedStore((state) => state.checkoutLineIds);
  const activeLines = useSharedStore((state) => state.activeCartLines);

  const selectedLines = useMemo(() => {
    if (checkoutLineIds.length === 0) {
      return activeLines.filter((line) => line.selected);
    }
    const allowed = new Set(checkoutLineIds);
    return activeLines.filter((line) => allowed.has(line.lineId));
  }, [activeLines, checkoutLineIds]);

  const resolved = useMemo(() => resolveLines(selectedLines), [selectedLines]);
  const groups = useMemo(() => groupCartLines(resolved.filter((line) => line.isAvailable)), [resolved]);
  const summary = useMemo(() => summarizeCart(resolved.filter((line) => line.isAvailable)), [resolved]);

  const cartLink = (
    <Link
      href={withLocale(locale, "/cart")}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
    >
      {t("backToCart")}
    </Link>
  );

  if (!hydrated) {
    return <LoadingState title={t("title")} message={t("description")} rows={4} />;
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          title={t("emptyTitle")}
          message={t("emptyMessage")}
          icon={<ShoppingBagIcon className="size-5" />}
          action={cartLink}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DetailShell>
        <div className="space-y-4">
          {groups.map((group) => (
            <CardShell key={group.shopId} className="overflow-hidden">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{pickText(group.shopName, locale)}</span>
                  <Badge variant={group.shopType === "careu" ? "default" : "secondary"}>
                    {group.shopType === "careu" ? t("careuShop") : t("marketplaceSeller")}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{t("shopLabel")}</span>
              </CardHeader>
              <div className="divide-y">
                {group.lines.map((line) => (
                  <div key={line.lineId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image src={line.image} alt={pickText(line.title, locale)} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pickText(line.title, locale)}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.variantTitle ? `${pickText(line.variantTitle, locale)} · ` : ""}
                        {t("quantityLabel")}: {line.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(BigInt(line.lineTotalBdt), locale)}</p>
                  </div>
                ))}
              </div>
            </CardShell>
          ))}
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <CardShell>
            <CardHeader>
              <h2 className="text-base font-semibold">{t("summaryTitle")}</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-semibold">{formatPrice(summary.subtotalBdt, locale)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("deliveryNote")}</p>
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{t("placeOrderNote")}</p>
              {cartLink}
              <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
            </CardContent>
          </CardShell>
        </div>
      </DetailShell>
    </div>
  );
}
