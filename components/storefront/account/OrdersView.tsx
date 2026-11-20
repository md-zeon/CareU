"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import {
  formatAccountDate,
  listOrders,
  variantOf,
  type AccountScenario,
  type OrderHistoryTab,
  type OrderStatusGroup,
} from "@/lib/mock/account";
import { useAccountCustomerId } from "@/lib/store/account/hooks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardHeader, CardShell, ListShell } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { withLocale } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";
import { useLastConfirmation } from "./useLastConfirmation";

function tabKey(tab: OrderHistoryTab): string {
  return tab.status;
}

export function OrdersView({ locale, scenario }: { locale: Locale; scenario: AccountScenario }) {
  const t = useTranslations("Orders");
  const account = useTranslations("Account");
  const customerId = useAccountCustomerId();
  const confirmation = useLastConfirmation();
  const [activeTab, setActiveTab] = useState<string>("all");
  const variant = variantOf(scenario, "order");

  const result = useMemo(
    () =>
      customerId && confirmation !== undefined
        ? listOrders(customerId, { scenario, confirmation })
        : null,
    [confirmation, customerId, scenario],
  );

  if (!customerId || confirmation === undefined || variant === "loading" || variant === "error") {
    if (variant === "error") {
      return <ErrorState title={t("errorTitle")} message={t("errorMessage")} />;
    }
    return <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={5} />;
  }

  if (!result?.ok) {
    return <ErrorState title={t("errorTitle")} message={t(result?.error.messageKey ?? "errorMessage")} />;
  }

  const { tabs, ordersByTab } = result.data;
  const orders = ordersByTab[activeTab] ?? [];

  return (
    <CardShell>
      <CardHeader className="space-y-1">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("title")}>
          {tabs.map((tab) => {
            const selected = tabKey(tab) === activeTab;
            const label = tab.status === "all" ? t("tabAll") : account(`status_${tab.status}`);
            return (
              <button
                key={tabKey(tab)}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tabKey(tab))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {label} <span className="opacity-70">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            action={
              <Link href={withLocale(locale, "/search")} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("browseAction")}
              </Link>
            }
          />
        ) : (
          <ListShell>
            {orders.map((order) => {
              const statusKey = order.statusGroup as OrderStatusGroup;
              return (
                <div key={order.orderNumber} className="space-y-2 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.placedAtLabel
                          ? order.placedAtLabel
                          : formatAccountDate(order.placedAt, locale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{account(`status_${statusKey}`)}</Badge>
                      <Badge variant="outline">
                        {order.source === "confirmation" ? t("confirmationBadge") : t("fixtureBadge")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {t("itemCount", { count: order.itemCount })} · {t("shopCount", { count: order.shopCount })} · {t("shipmentCount", { count: order.shipmentCount })}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold">{formatPrice(order.totalPoisha, locale)}</span>
                      <Link
                        href={withLocale(locale, `/account/orders/${encodeURIComponent(order.orderNumber)}?scenario=${scenario.id}`)}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        {t("viewOrder")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </ListShell>
        )}
        <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
      </CardContent>
    </CardShell>
  );
}
