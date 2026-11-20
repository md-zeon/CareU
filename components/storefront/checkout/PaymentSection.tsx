"use client";

import { useTranslations } from "next-intl";
import { CreditCardIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/storefront/states";
import { CardContent, CardHeader, CardShell } from "@/components/storefront/primitives";
import { pickText } from "@/components/storefront/home/home-utils";
import type { Locale } from "@/lib/i18n/routing";
import type { PaymentMethodView } from "@/lib/mock/checkout";
import { cn } from "@/lib/utils";

/** Payment method picker with a clearly labeled mock gateway panel. */
export function PaymentSection({
  locale,
  methods,
  selectedId,
  onSelect,
  failure,
  onRetry,
}: {
  locale: Locale;
  methods: PaymentMethodView[];
  selectedId: string;
  onSelect: (methodId: PaymentMethodView["id"]) => void;
  failure: { title: string; message: string; retryLabel: string } | null;
  onRetry: () => void;
}) {
  const t = useTranslations("Checkout");
  const selected = methods.find((method) => method.id === selectedId) ?? methods[0];

  return (
    <CardShell>
      <CardHeader className="space-y-1">
        <h2 className="text-base font-semibold">{t("paymentTitle")}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t("paymentIntro")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {failure ? (
          <ErrorState
            title={failure.title}
            message={failure.message}
            retryLabel={failure.retryLabel}
            onRetry={onRetry}
          />
        ) : null}

        <fieldset className="space-y-3">
          <legend className="sr-only">{t("paymentTitle")}</legend>
          {methods.map((method) => {
            const checked = method.id === selected?.id;
            return (
              <label
                key={method.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors focus-within:ring-3 focus-within:ring-ring/50",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  name="checkout-payment"
                  className="mt-1 size-4 accent-primary"
                  checked={checked}
                  onChange={() => onSelect(method.id)}
                />
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-medium">{pickText(method.label, locale)}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">
                    {pickText(method.description, locale)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {selected?.showsMockGateway ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <CreditCardIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">{t("mockGatewayTitle")}</p>
              <Badge variant="secondary">{t("mockGatewayBadge")}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("mockGatewayNote")}</p>
          </div>
        ) : null}

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
          {t("prototypeNote")}
        </p>
      </CardContent>
    </CardShell>
  );
}
