"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { LoaderCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type {
  CheckoutAddressSelection,
  CheckoutTotals,
  DeliveryOptionView,
  PaymentMethodView,
} from "@/lib/mock/checkout";
import { CardContent, CardHeader, CardShell } from "@/components/storefront/primitives";
import { ErrorState, InlineHint } from "@/components/storefront/states";
import { pickText } from "@/components/storefront/home/home-utils";

/** Snapshot review, money summary, and the single mock placement action. */
export function CheckoutSummary({
  locale,
  totals,
  deliveryOption,
  paymentMethod,
  addressSelection,
  unavailable,
  placing,
  placementFailure,
  onPlaceOrder,
  onRetryPlacement,
}: {
  locale: Locale;
  totals: CheckoutTotals;
  deliveryOption: DeliveryOptionView;
  paymentMethod: PaymentMethodView;
  addressSelection: CheckoutAddressSelection | null;
  unavailable: boolean;
  placing: boolean;
  placementFailure: { title: string; message: string; retryLabel: string } | null;
  onPlaceOrder: () => void;
  onRetryPlacement: () => void;
}) {
  const t = useTranslations("Checkout");
  const addressMissing = !addressSelection;
  const placeDisabled = placing || unavailable || addressMissing;

  const addressLines = addressSelection
    ? addressSelection.kind === "saved"
      ? [
          addressSelection.address.label,
          `${addressSelection.address.recipientName} · ${addressSelection.address.phone}`,
          `${addressSelection.address.addressLine}, ${addressSelection.address.district}`,
        ]
      : [
          `${addressSelection.address.recipientName} · ${addressSelection.address.phone}`,
          `${addressSelection.address.addressLine}, ${addressSelection.address.district}`,
        ]
    : [];

  return (
    <CardShell>
      <CardHeader className="space-y-1">
        <h2 className="text-base font-semibold">{t("summaryTitle")}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t("summaryIntro")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-xs sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="font-medium text-muted-foreground">{t("addressTitle")}</dt>
            <dd className="space-y-0.5 leading-5">
              {addressLines.length > 0 ? (
                addressLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
              ) : (
                <p className="text-destructive">{t("addressRequired")}</p>
              )}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-muted-foreground">{t("deliveryTitle")}</dt>
            <dd className="leading-5">{pickText(deliveryOption.label, locale)}</dd>
            <dd className="text-muted-foreground">{formatPrice(deliveryOption.chargePoisha, locale)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-muted-foreground">{t("paymentTitle")}</dt>
            <dd className="leading-5">{pickText(paymentMethod.label, locale)}</dd>
          </div>
        </dl>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t("itemsTitle")}</h3>
            <span className="text-xs text-muted-foreground">{t("itemCount", { count: totals.itemCount })}</span>
          </div>
          {totals.perShopSummary.map((shop) => (
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
                      <Image
                        src={item.image}
                        alt={pickText(item.title, locale)}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pickText(item.title, locale)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variantTitle ? `${pickText(item.variantTitle, locale)} · ` : ""}
                        {t("quantityLabel")}: {item.quantity}
                      </p>
                      {item.availability === "out_of_stock" ? (
                        <p className="text-xs text-destructive">{t("unavailableTitle")}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(item.lineTotalPoisha, locale)}</p>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                <span>{t("shopLabel")}: {pickText(shop.shopName, locale)}</span>
                <span>{formatPrice(shop.subtotalPoisha, locale)}</span>
              </div>
            </div>
          ))}
        </div>

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

        {unavailable ? (
          <ErrorState
            title={t("unavailableTitle")}
            message={t("unavailableMessage")}
          />
        ) : null}

        {addressMissing && !unavailable ? <InlineHint tone="error">{t("addressRequired")}</InlineHint> : null}

        {placementFailure ? (
          <ErrorState
            title={placementFailure.title}
            message={placementFailure.message}
            retryLabel={placementFailure.retryLabel}
            onRetry={onRetryPlacement}
          />
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={placeDisabled}
            aria-busy={placing}
            onClick={onPlaceOrder}
          >
            {placing ? <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" /> : null}
            {placing ? t("placing") : t("placeOrder")}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">{t("placeOrderNote")}</p>
          {unavailable ? (
            <p className="text-xs leading-5 text-muted-foreground">{t("lateAvailabilityNote")}</p>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
        </div>
      </CardContent>
    </CardShell>
  );
}
