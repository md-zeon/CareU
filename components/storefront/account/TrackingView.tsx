"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangleIcon, ArrowLeftIcon, TruckIcon } from "lucide-react";
import {
  demoShipmentStates,
  formatAccountDate,
  getTracking,
  variantOf,
  type AccountScenario,
  type TrackingStep,
  type TrackingView as TrackingViewModel,
} from "@/lib/mock/account";
import type { Locale } from "@/lib/i18n/routing";
import { useAccountCustomerId } from "@/lib/store/account/hooks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardHeader, CardShell, DetailShell } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";
import { useLastConfirmation } from "./useLastConfirmation";

function StepItem({ step, label }: { step: TrackingStep; label: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
          step.state === "complete" && "border-emerald-500 bg-emerald-500 text-white",
          step.state === "current" && "border-primary bg-primary text-primary-foreground",
          step.state === "upcoming" && "border-muted-foreground/30 text-muted-foreground",
          step.state === "stopped" && "border-destructive bg-destructive text-destructive-foreground",
        )}
      >
        {step.state === "complete" ? "✓" : step.state === "stopped" ? "!" : ""}
      </span>
      <span className={cn("text-sm", step.state === "upcoming" ? "text-muted-foreground" : "font-medium")}>{label}</span>
    </li>
  );
}

export function TrackingView({
  locale,
  shipmentId,
  scenario,
}: {
  locale: Locale;
  shipmentId?: string;
  scenario: AccountScenario;
}) {
  const t = useTranslations("Tracking");
  const account = useTranslations("Account");
  const customerId = useAccountCustomerId();
  const confirmation = useLastConfirmation();
  const variant = variantOf(scenario, "shipment");

  const result = useMemo(
    () =>
      customerId && confirmation !== undefined && shipmentId
        ? getTracking(customerId, shipmentId, locale, { scenario, confirmation })
        : null,
    [confirmation, customerId, locale, scenario, shipmentId],
  );

  const reviewHref = (id: string) => withLocale(locale, `/order/track?shipment=${encodeURIComponent(id)}&scenario=${scenario.id}`);

  return (
    <div className="space-y-4">
      <CardShell>
        <CardHeader className="space-y-1">
          <h2 className="text-base font-semibold">{t("selectShipment")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("selectShipmentHint")}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {demoShipmentStates.map((shipment) => (
            <Link
              key={shipment.shipmentId}
              href={reviewHref(shipment.shipmentId)}
              className={buttonVariants({
                variant: shipment.shipmentId === shipmentId ? "default" : "outline",
                size: "sm",
              })}
            >
              {account(`status_${shipment.status}`)}
            </Link>
          ))}
        </CardContent>
      </CardShell>

      {!customerId || confirmation === undefined || variant === "loading" ? (
        <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={5} />
      ) : variant === "error" ? (
        <ErrorState title={t("errorTitle")} message={t("errorMessage")} />
      ) : !shipmentId ? (
        <EmptyState
          title={t("emptyTitle")}
          message={t("emptyMessage")}
          icon={<TruckIcon className="size-5" />}
        />
      ) : !result?.ok ? (
        <EmptyState
          title={t("notFoundTitle")}
          message={result ? t(result.error.messageKey) : t("notFoundMessage")}
          icon={<TruckIcon className="size-5" />}
          action={
            <Link href={withLocale(locale, "/account/orders")} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("backToOrder")}
            </Link>
          }
        />
      ) : (
        <TrackingContent locale={locale} tracking={result.data} scenarioId={scenario.id} />
      )}

      <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
    </div>
  );
}

function TrackingContent({
  locale,
  tracking,
  scenarioId,
}: {
  locale: Locale;
  tracking: TrackingViewModel;
  scenarioId: string;
}) {
  const t = useTranslations("Tracking");
  const account = useTranslations("Account");

  return (
    <>
      {tracking.deliveryException ? (
        <CardShell className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3" role="alert">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-destructive">{t("exceptionTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("exceptionMessage")}</p>
            </div>
          </CardContent>
        </CardShell>
      ) : null}

      <CardShell>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("shipmentLabel")}: <span className="font-mono">{tracking.shipmentId}</span></p>
            <h3 className="text-base font-semibold">{pickText(tracking.shopName, locale)}</h3>
          </div>
          <Badge variant={tracking.deliveryException ? "destructive" : "secondary"}>
            {account(`status_${tracking.status}`)}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("orderNumberLabel")}</p>
            <Link
              href={withLocale(locale, `/account/orders/${encodeURIComponent(tracking.orderNumber)}?scenario=${scenarioId}`)}
              className="font-mono text-sm font-semibold underline underline-offset-4"
            >
              {tracking.orderNumber}
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("trackingNumberLabel")}</p>
            <p className="text-sm font-medium" dir="ltr">{tracking.trackingNumber ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("statusLabel")}</p>
            <p className="text-sm font-medium">{account(`status_${tracking.status}`)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("lastUpdateLabel")}</p>
            <p className="text-sm font-medium">{tracking.lastUpdateLabel || "-"}</p>
          </div>
        </CardContent>
      </CardShell>

      <DetailShell>
        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{t("progressTitle")}</h3>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {tracking.steps.map((step, index) => (
                <StepItem key={`${step.status}-${index}`} step={step} label={account(`status_${step.status}`)} />
              ))}
            </ol>
          </CardContent>
        </CardShell>

        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{t("timelineTitle")}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4">
              {tracking.timeline.map((event) => (
                <li key={event.eventId} className="space-y-1 border-l-2 border-muted pl-4">
                  <p className="text-sm font-medium">
                    {account(`status_${event.status}`)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {event.at ? formatAccountDate(event.at, locale) : ""}
                    </span>
                  </p>
                  {event.note ? <p className="text-xs text-muted-foreground">{t("eventNote")}: {pickText(event.note, locale)}</p> : null}
                  {event.actorLabel ? <p className="text-xs text-muted-foreground">{t("eventActor")}: {pickText(event.actorLabel, locale)}</p> : null}
                </li>
              ))}
            </ol>
            {tracking.deliveryException ? (
              <div className="space-y-2 rounded-xl border p-4">
                <p className="text-sm font-medium">{t("supportTitle")}</p>
                <p className="text-xs leading-5 text-muted-foreground">{t("supportMessage")}</p>
                <Link href={tracking.supportHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {t("supportLink")}
                </Link>
              </div>
            ) : null}
            <Link
              href={withLocale(locale, `/account/orders/${encodeURIComponent(tracking.orderNumber)}?scenario=${scenarioId}`)}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {t("backToOrder")}
            </Link>
          </CardContent>
        </CardShell>
      </DetailShell>
    </>
  );
}
