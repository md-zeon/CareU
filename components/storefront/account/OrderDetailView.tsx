"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, PackageIcon, TruckIcon } from "lucide-react";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import {
  formatAccountDate,
  getOrderDetail,
  variantOf,
  type AccountScenario,
  type ShipmentSummaryView,
} from "@/lib/mock/account";
import { useAccountCustomerId } from "@/lib/store/account/hooks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardHeader, CardShell, DetailShell } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { useLastConfirmation } from "./useLastConfirmation";

function ShipmentCard({
  shipment,
  locale,
  scenarioId,
}: {
  shipment: ShipmentSummaryView;
  locale: Locale;
  scenarioId: string;
}) {
  const t = useTranslations("OrderDetail");
  const account = useTranslations("Account");
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {t("shipmentLabel")}: <span className="font-mono text-xs">{shipment.shipmentId}</span>
        </p>
        <p className="text-xs text-muted-foreground">{pickText(shipment.shopName, locale)}</p>
        <p className="text-xs text-muted-foreground">
          {t("trackingNumberLabel")}: {shipment.trackingNumber ?? t("noTrackingNumber")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{account(`status_${shipment.status}`)}</Badge>
        <Link
          href={withLocale(locale, `/order/track?shipment=${encodeURIComponent(shipment.shipmentId)}&scenario=${scenarioId}`)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <TruckIcon aria-hidden="true" />
          {t("trackShipment")}
        </Link>
      </div>
    </div>
  );
}

export function OrderDetailView({
  locale,
  orderNumber,
  scenario,
}: {
  locale: Locale;
  orderNumber: string;
  scenario: AccountScenario;
}) {
  const t = useTranslations("OrderDetail");
  const account = useTranslations("Account");
  const customerId = useAccountCustomerId();
  const confirmation = useLastConfirmation();
  const variant = variantOf(scenario, "order");

  const result = useMemo(
    () =>
      customerId && confirmation !== undefined
        ? getOrderDetail(customerId, orderNumber, { scenario, confirmation })
        : null,
    [confirmation, customerId, orderNumber, scenario],
  );

  if (!customerId || confirmation === undefined || variant === "loading") {
    return <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={6} />;
  }

  if (variant === "error") {
    return <ErrorState title={t("errorTitle")} message={t("errorMessage")} />;
  }

  if (!result?.ok) {
    return (
      <EmptyState
        title={t("notFoundTitle")}
        message={result ? t(result.error.messageKey) : t("notFoundMessage")}
        icon={<PackageIcon className="size-5" />}
        action={
          <Link href={withLocale(locale, "/account/orders")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("backToOrders")}
          </Link>
        }
      />
    );
  }

  const detail = result.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={withLocale(locale, "/account/orders")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeftIcon aria-hidden="true" />
            {t("backToOrders")}
          </Link>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
        </div>
        <Badge variant="secondary">{account(`status_${detail.statusGroup}`)}</Badge>
      </div>

      <CardShell>
        <CardHeader>
          <h3 className="text-base font-semibold">{t("orderNumberLabel")}</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">{t("orderNumberLabel")}</p>
            <p className="font-mono text-sm font-semibold">{detail.orderNumber}</p>
          </div>
          <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">{t("placedAtLabel")}</p>
            <p className="text-sm font-medium">
              {detail.placedAtLabel ?? (detail.placedAt ? formatAccountDate(detail.placedAt, locale) : "-")}
            </p>
          </div>
          <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">{t("statusLabel")}</p>
            <p className="text-sm font-medium">{account(`status_${detail.statusGroup}`)}</p>
          </div>
        </CardContent>
      </CardShell>

      <DetailShell>
        <div className="space-y-4">
          <CardShell>
            <CardHeader>
              <h3 className="text-base font-semibold">{t("itemsTitle")}</h3>
            </CardHeader>
            <CardContent className="space-y-5">
              {detail.perShopGroups.map((group) => (
                <div key={group.shopId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{pickText(group.shopName, locale)}</p>
                    <Badge variant={group.shopType === "careu" ? "default" : "secondary"}>
                      {group.shopType === "careu" ? t("careuShop") : t("marketplaceSeller")}
                    </Badge>
                  </div>
                  <ul className="divide-y rounded-xl border">
                    {group.items.map((item) => (
                      <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{pickText(item.title, locale)}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantTitle ? `${pickText(item.variantTitle, locale)} · ` : ""}
                            {t("quantityLabel")}: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(item.lineTotalPoisha, locale)}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-right text-xs text-muted-foreground">{formatPrice(group.subtotalPoisha, locale)}</p>
                </div>
              ))}
              <p className="text-xs leading-5 text-muted-foreground">{t("snapshotNote")}</p>
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <h3 className="text-base font-semibold">{t("shipmentsTitle")}</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noTrackingNumber")}</p>
              ) : (
                detail.shipments.map((shipment) => (
                  <ShipmentCard key={shipment.shipmentId} shipment={shipment} locale={locale} scenarioId={scenario.id} />
                ))
              )}
            </CardContent>
          </CardShell>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <CardShell>
            <CardHeader>
              <h3 className="text-base font-semibold">{t("addressTitle")}</h3>
            </CardHeader>
            <CardContent className="space-y-0.5 text-sm leading-6">
              {detail.addressSnapshot.lines.length === 0 ? (
                <p className="text-muted-foreground">-</p>
              ) : (
                detail.addressSnapshot.lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
              )}
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <h3 className="text-base font-semibold">{t("summaryTitle")}</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs">
                <p className="font-medium text-muted-foreground">{t("deliveryTitle")}</p>
                <p>{pickText(detail.deliverySnapshot.label, locale)}</p>
                <p className="text-muted-foreground">{pickText(detail.deliverySnapshot.description, locale)}</p>
                <p className="pt-1 font-medium text-muted-foreground">{t("paymentTitle")}</p>
                <p>{pickText(detail.paymentSnapshot.label, locale)}</p>
                <p className="text-muted-foreground">{pickText(detail.paymentSnapshot.description, locale)}</p>
              </div>
              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="font-semibold">{formatPrice(detail.totals.subtotalPoisha, locale)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t("deliveryFee")}</span>
                  <span className="font-semibold">{formatPrice(detail.totals.deliveryPoisha, locale)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-3 text-base">
                  <span className="font-medium">{t("total")}</span>
                  <span className="font-semibold">{formatPrice(detail.totals.totalPoisha, locale)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("itemCount", { count: detail.totals.itemCount })}</p>
            </CardContent>
          </CardShell>
        </div>
      </DetailShell>
      <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
    </div>
  );
}
