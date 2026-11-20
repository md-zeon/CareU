"use client";

import { useTranslations } from "next-intl";
import { TruckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type { DeliveryOptionView } from "@/lib/mock/checkout";
import { CardContent, CardHeader, CardShell } from "@/components/storefront/primitives";
import { pickText } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

/** Delivery option picker. Every charge comes from the mock rule table. */
export function DeliverySection({
  locale,
  options,
  selectedId,
  onSelect,
}: {
  locale: Locale;
  options: DeliveryOptionView[];
  selectedId: string;
  onSelect: (optionId: string) => void;
}) {
  const t = useTranslations("Checkout");

  return (
    <CardShell>
      <CardHeader className="space-y-1">
        <h2 className="text-base font-semibold">{t("deliveryTitle")}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t("deliveryIntro")}</p>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-3">
          <legend className="sr-only">{t("deliveryTitle")}</legend>
          {options.map((option) => {
            const checked = option.id === selectedId;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-xl border p-4 transition-colors focus-within:ring-3 focus-within:ring-ring/50",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <span className="flex min-w-0 flex-1 gap-3">
                  <input
                    type="radio"
                    name="checkout-delivery"
                    className="mt-1 size-4 accent-primary"
                    checked={checked}
                    onChange={() => onSelect(option.id)}
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{pickText(option.label, locale)}</span>
                      {option.usesFallback ? <Badge variant="outline">{t("fallbackChargeNote")}</Badge> : null}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {pickText(option.description, locale)}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <TruckIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {formatPrice(option.chargePoisha, locale)}
                </span>
              </label>
            );
          })}
        </fieldset>
      </CardContent>
    </CardShell>
  );
}
