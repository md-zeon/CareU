"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import { LAST_CONFIRMATION_KEY, parseLastConfirmationValue, type OrderConfirmation } from "@/lib/mock/checkout";
import { CardContent, CardHeader, CardShell, DetailShell, PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, LoadingState, SuccessState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";

function addressLines(confirmation: OrderConfirmation): string[] {
  const snapshot = confirmation.addressSnapshot;
  if (snapshot.kind === "saved") {
    return [
      snapshot.address.label,
      `${snapshot.address.recipientName} · ${snapshot.address.phone}`,
      `${snapshot.address.addressLine}, ${snapshot.address.district}`,
    ];
  }
  return [
    `${snapshot.address.recipientName} · ${snapshot.address.phone}`,
    `${snapshot.address.addressLine}, ${snapshot.address.district}`,
  ];
}

const LOADING_SNAPSHOT = "__loading__";
const EMPTY_SNAPSHOT = "__empty__";

function subscribeToConfirmation(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getConfirmationSnapshot(): string {
  return window.sessionStorage.getItem(LAST_CONFIRMATION_KEY) ?? EMPTY_SNAPSHOT;
}

function getServerConfirmationSnapshot(): string {
  return LOADING_SNAPSHOT;
}

/** Reads the last local confirmation so a refresh keeps the reviewable result. */
export function OrderConfirmationView({ locale }: { locale: Locale }) {
  const t = useTranslations("OrderConfirmation");
  const snapshot = useSyncExternalStore(subscribeToConfirmation, getConfirmationSnapshot, getServerConfirmationSnapshot);
  const confirmation = useMemo<OrderConfirmation | null | undefined>(() => {
    if (snapshot === LOADING_SNAPSHOT) return undefined;
    if (snapshot === EMPTY_SNAPSHOT) return null;
    return parseLastConfirmationValue(snapshot);
  }, [snapshot]);

  if (confirmation === undefined) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <LoadingState title={t("title")} message={t("description")} rows={5} />
      </PageContainer>
    );
  }

  if (!confirmation) {
    return (
      <PageContainer className="space-y-6 py-8 sm:py-10">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <EmptyState
          title={t("notFoundTitle")}
          message={t("notFoundMessage")}
          icon={<ShoppingBagIcon className="size-5" />}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={withLocale(locale, "/checkout")} className={buttonVariants()}>
                {t("continueBrowsing")}
              </Link>
              <Link href={withLocale(locale, "/")} className={buttonVariants({ variant: "outline" })}>
                {t("backToHome")}
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  const { totals } = confirmation;

  return (
    <PageContainer className="space-y-6 py-8 sm:py-10">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <SuccessState title={t("successTitle")} message={t("successMessage")} />

      <CardShell>
        <CardHeader className="space-y-1">
          <h2 className="text-base font-semibold">{t("orderNumberLabel")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("orderNumberLabel")}</dt>
              <dd className="font-mono text-lg font-semibold tracking-tight">{confirmation.orderNumber}</dd>
            </div>
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("placedAtLabel")}</dt>
              <dd className="text-sm font-medium">{confirmation.placedAtLabel}</dd>
            </div>
          </dl>
        </CardContent>
      </CardShell>

      <DetailShell>
        <div className="space-y-4">
          <CardShell>
            <CardHeader className="space-y-1">
              <h2 className="text-base font-semibold">{t("itemsTitle")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("itemCount", { count: totals.itemCount })}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmation.perShopSummary.map((shop) => (
                <div key={shop.shopId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{pickText(shop.shopName, locale)}</span>
                    <Badge variant={shop.shopType === "careu" ? "default" : "secondary"}>
                      {shop.shopType === "careu" ? t("careuShop") : t("marketplaceSeller")}
                    </Badge>
                  </div>
                  <ul className="divide-y rounded-xl border">
                    {shop.items.map((item) => (
                      <li key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center gap-3 p-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={item.image} alt={pickText(item.title, locale)} fill sizes="48px" className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{pickText(item.title, locale)}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantTitle ? `${pickText(item.variantTitle, locale)} · ` : ""}
                            {t("quantityLabel")}: {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">{formatPrice(item.lineTotalPoisha, locale)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                    <span>
                      {t("shopLabel")}: {pickText(shop.shopName, locale)}
                    </span>
                    <span>{formatPrice(shop.subtotalPoisha, locale)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <h2 className="text-base font-semibold">{t("addressTitle")}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5 text-sm leading-6">
                {addressLines(confirmation).map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </CardContent>
          </CardShell>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <CardShell>
            <CardHeader className="space-y-1">
              <h2 className="text-base font-semibold">{t("summaryTitle")}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="font-medium text-muted-foreground">{t("deliveryTitle")}</dt>
                  <dd>{pickText(confirmation.deliverySnapshot.label, locale)}</dd>
                  <dd className="text-muted-foreground">{pickText(confirmation.deliverySnapshot.description, locale)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">{t("paymentTitle")}</dt>
                  <dd>{pickText(confirmation.paymentSnapshot.label, locale)}</dd>
                  <dd className="text-muted-foreground">{pickText(confirmation.paymentSnapshot.description, locale)}</dd>
                </div>
              </dl>

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="font-semibold">{formatPrice(totals.subtotalPoisha, locale)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("deliveryFee")}</span>
                  <span className="font-semibold">{formatPrice(totals.deliveryPoisha, locale)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-3 text-base">
                  <span className="font-medium">{t("total")}</span>
                  <span className="font-semibold">{formatPrice(totals.totalPoisha, locale)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={withLocale(locale, "/")} className={buttonVariants()}>
                  {t("backToHome")}
                </Link>
                <Link href={withLocale(locale, "/search")} className={buttonVariants({ variant: "outline" })}>
                  {t("continueBrowsing")}
                </Link>
              </div>
            </CardContent>
          </CardShell>
        </div>
      </DetailShell>

      <p className="text-xs leading-5 text-muted-foreground">{t("noTrackingNote")}</p>
      <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
    </PageContainer>
  );
}
