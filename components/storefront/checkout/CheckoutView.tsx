"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import {
  clearBuyNowDraft,
  createCheckoutDraft,
  districtKeyFor,
  getDeliveryOptions,
  getPaymentMethods,
  getSavedAddresses,
  hasUnavailableItem,
  placeMockOrder,
  readBuyNowDraft,
  recomputeTotals,
  saveLastConfirmation,
  toCheckoutItemSnapshot,
  type CheckoutDraft,
  type CheckoutFailure,
  type CheckoutScenario,
  type DraftResult,
} from "@/lib/mock/checkout";
import { resolveLine, resolveLines } from "@/lib/store/shared/resolve";
import { useSharedStoreContext, useSharedStoreHydrated } from "@/lib/store/shared/provider";
import { DetailShell, PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, LoadingState } from "@/components/storefront/states";
import { withLocale } from "@/components/storefront/home/home-utils";
import { AddressSection } from "./AddressSection";
import { DeliverySection } from "./DeliverySection";
import { PaymentSection } from "./PaymentSection";
import { CheckoutSummary } from "./CheckoutSummary";

type CheckoutOverrides = Partial<Pick<CheckoutDraft, "addressSelection" | "deliveryOptionId" | "paymentMethodId">>;

/** Client checkout shell. The draft is local state and never writes to the cart. */
export function CheckoutView({ locale, scenario }: { locale: Locale; scenario: CheckoutScenario }) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const hydrated = useSharedStoreHydrated();
  const { store } = useSharedStoreContext();

  const [overrideState, setOverrideState] = useState<{ key: string; value: CheckoutOverrides }>({ key: "", value: {} });
  const [placementState, setPlacementState] = useState<{ key: string; failure: CheckoutFailure | null }>({
    key: "",
    failure: null,
  });
  const [placing, setPlacing] = useState(false);
  const currentKey = `${hydrated ? "hydrated" : "pending"}:${scenario}`;

  // Snapshot once per hydration and scenario. Later cart changes do not redraft checkout.
  const baseResult = useMemo<DraftResult | null>(() => {
    if (!hydrated) return null;

    const state = store.getState();
    const handoff = readBuyNowDraft();
    // A fresh buy now handoff wins over an older cart selection. Cart entry
    // clears the handoff before navigating here.
    const fromCart = scenario === "empty_selection" || !handoff;

    if (fromCart) {
      const allowed = new Set(state.checkoutLineIds);
      const chosen =
        allowed.size > 0
          ? state.activeCartLines.filter((line) => allowed.has(line.lineId))
          : state.activeCartLines.filter((line) => line.selected);
      const lines = resolveLines(chosen)
        .filter((line) => line.isAvailable)
        .map((line) => toCheckoutItemSnapshot(line));
      return createCheckoutDraft({ source: "cart", lines, scenario });
    }

    if (handoff) {
      const resolved = resolveLine({
        lineId: "buy-now",
        productId: handoff.productId,
        variantId: handoff.variantId,
        shopId: handoff.shopId,
        quantity: handoff.quantity,
        selected: true,
        addedAt: "",
      });
      return createCheckoutDraft({
        source: "buy_now",
        handoff,
        resolved: toCheckoutItemSnapshot(resolved, { lineId: null }),
        scenario,
      });
    }

    return createCheckoutDraft({ source: "cart", lines: [], scenario });
  }, [hydrated, scenario, store]);

  const overrides = useMemo(
    () => (overrideState.key === currentKey ? overrideState.value : {}),
    [overrideState, currentKey],
  );
  const draft = useMemo(
    () => (baseResult?.ok ? { ...baseResult.draft, ...overrides } : null),
    [baseResult, overrides],
  );
  const blockedFailure = baseResult && !baseResult.ok ? baseResult.failure : null;
  const placementFailure = placementState.key === currentKey ? placementState.failure : null;

  const updateOverrides = useCallback(
    (patch: CheckoutOverrides) => {
      setOverrideState((current) => ({
        key: currentKey,
        value: current.key === currentKey ? { ...current.value, ...patch } : patch,
      }));
    },
    [currentKey],
  );

  const setPlacementFailure = useCallback(
    (failure: CheckoutFailure | null) => {
      setPlacementState({ key: currentKey, failure });
    },
    [currentKey],
  );

  const savedAddresses = useMemo(() => getSavedAddresses(scenario, locale), [scenario, locale]);
  const paymentMethods = useMemo(() => getPaymentMethods(), []);

  const destinationDistrictKey = useMemo(() => {
    const selection = draft?.addressSelection;
    if (!selection) return "other";
    if (selection.kind === "saved") return selection.address.districtKey;
    return districtKeyFor(selection.address.district);
  }, [draft?.addressSelection]);

  const deliveryOptions = useMemo(() => getDeliveryOptions(destinationDistrictKey), [destinationDistrictKey]);
  const selectedDelivery = deliveryOptions.find((option) => option.id === draft?.deliveryOptionId) ?? deliveryOptions[0];
  const selectedPayment = paymentMethods.find((method) => method.id === draft?.paymentMethodId) ?? paymentMethods[0];

  const totalsResult = useMemo(
    () => (draft ? recomputeTotals(draft, selectedDelivery.chargePoisha) : null),
    [draft, selectedDelivery.chargePoisha],
  );

  const unavailable = draft ? hasUnavailableItem(draft) : false;

  const messageFor = useCallback((key: string) => t(key as Parameters<typeof t>[0]), [t]);

  const placeOrder = useCallback(async () => {
    if (!draft || !draft.addressSelection || placing || unavailable || !totalsResult?.ok) return;
    setPlacing(true);
    setPlacementFailure(null);

    const result = await placeMockOrder({
      draft,
      addressSelection: draft.addressSelection,
      deliveryOption: selectedDelivery,
      paymentMethod: selectedPayment,
      scenario,
      locale,
    });

    setPlacing(false);
    if (!result.ok) {
      setPlacementFailure(result.failure);
      return;
    }

    saveLastConfirmation(result.confirmation);
    clearBuyNowDraft();
    router.push(withLocale(locale, "/order/confirmation"));
  }, [draft, locale, placing, router, scenario, selectedDelivery, selectedPayment, setPlacementFailure, totalsResult?.ok, unavailable]);

  const paymentFailure =
    placementFailure?.stage === "payment"
      ? {
          title: t("paymentFailureTitle"),
          message: messageFor(placementFailure.messageKey),
          retryLabel: t("retryPayment"),
        }
      : null;
  const reviewFailure =
    placementFailure?.stage === "placement"
      ? {
          title: t("placementFailureTitle"),
          message: messageFor(placementFailure.messageKey),
          retryLabel: t("retryPlacement"),
        }
      : null;

  const steps = [t("stepAddress"), t("stepDelivery"), t("stepPayment"), t("stepReview")];
  const browseLink = (
    <Link href={withLocale(locale, "/search")} className={buttonVariants({ variant: "outline" })}>
      {t("browseAction")}
    </Link>
  );
  const cartLink = (
    <Link href={withLocale(locale, "/cart")} className={buttonVariants()}>
      {t("backToCart")}
    </Link>
  );

  if (!hydrated) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <LoadingState title={t("title")} message={t("description")} rows={5} />
      </PageContainer>
    );
  }

  if (!draft || !totalsResult?.ok) {
    return (
      <PageContainer className="space-y-6 py-8 sm:py-10">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <EmptyState
          title={t("emptyTitle")}
          message={blockedFailure ? messageFor(blockedFailure.messageKey) : t("emptyMessage")}
          icon={<ShoppingBagIcon className="size-5" />}
          action={
            <div className="flex flex-wrap gap-2">
              {cartLink}
              {browseLink}
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 py-8 sm:py-10">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <ol className="flex flex-wrap gap-2" aria-label={t("title")}>
        {steps.map((label, index) => (
          <li
            key={label}
            className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <DetailShell>
        <div className="space-y-4">
          <AddressSection
            addresses={savedAddresses}
            selection={draft.addressSelection}
            onSelect={(selection) => updateOverrides({ addressSelection: selection })}
          />
          <DeliverySection
            locale={locale}
            options={deliveryOptions}
            selectedId={selectedDelivery.id}
            onSelect={(optionId) => updateOverrides({ deliveryOptionId: optionId })}
          />
          <PaymentSection
            locale={locale}
            methods={paymentMethods}
            selectedId={selectedPayment.id}
            onSelect={(methodId) => updateOverrides({ paymentMethodId: methodId })}
            failure={paymentFailure}
            onRetry={placeOrder}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <CheckoutSummary
            locale={locale}
            totals={totalsResult.totals}
            deliveryOption={selectedDelivery}
            paymentMethod={selectedPayment}
            addressSelection={draft.addressSelection}
            unavailable={unavailable}
            placing={placing}
            placementFailure={reviewFailure}
            onPlaceOrder={placeOrder}
            onRetryPlacement={placeOrder}
          />
        </div>
      </DetailShell>

      <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
    </PageContainer>
  );
}
