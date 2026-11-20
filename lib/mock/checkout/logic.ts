/** Pure draft, total, and placement helpers for the checkout prototype. */

import type { Locale } from "@/lib/i18n/routing";
import type { ResolvedLine } from "@/lib/store/shared/resolve";
import { multiplyPoisha, POISHA_PER_BDT, sumPoisha, type Poisha } from "@/lib/money/poisha";
import type {
  CheckoutAddressSelection,
  CheckoutDraft,
  CheckoutFailure,
  CheckoutItemSnapshot,
  CheckoutScenario,
  CheckoutShopSummary,
  CheckoutTotals,
  DeliveryOptionView,
  DraftInput,
  DraftResult,
  OrderConfirmation,
  PaymentMethodView,
  PlacementResult,
  TotalsResult,
} from "./types";

const FAILURE_MESSAGE_KEYS = {
  empty: "emptyMessage",
  unavailable: "unavailableMessage",
  payment: "paymentFailureMessage",
  placement: "placementFailureMessage",
} as const;

function failure(stage: CheckoutFailure["stage"], code: string, messageKey: string, retryable: boolean): CheckoutFailure {
  return { stage, code, messageKey, retryable };
}

/** Stable local id derived from draft identity, so a retry keeps the same order number. */
function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(7, "0");
}

export function draftIdentity(draft: CheckoutDraft): string {
  const items = draft.items
    .map((item) => `${item.productId}:${item.variantId ?? "-"}:${item.shopId}:${item.quantity}:${item.lineId ?? "buy-now"}`)
    .join("|");
  return `${draft.source}|${items}|${draft.scenario}`;
}

export function createDraftId(identity: string): string {
  return `draft-${stableHash(identity)}`;
}

export function createOrderNumber(draft: CheckoutDraft, deliveryOptionId: string, paymentMethodId: string): string {
  const addressKey =
    draft.addressSelection?.kind === "saved"
      ? draft.addressSelection.address.id
      : draft.addressSelection
        ? "inline"
        : "none";
  return `CU-${stableHash(`${draftIdentity(draft)}|${deliveryOptionId}|${paymentMethodId}|${addressKey}`)}`;
}

/** Turn a resolved cart line into an immutable display and money snapshot. */
export function toCheckoutItemSnapshot(
  line: ResolvedLine,
  options: { lineId?: string | null; forceUnavailable?: boolean } = {},
): CheckoutItemSnapshot {
  const unitPricePoisha = BigInt(line.unitPriceBdt) * POISHA_PER_BDT;
  return {
    lineId: options.lineId === undefined ? line.lineId : options.lineId,
    productId: line.productId,
    variantId: line.variantId,
    shopId: line.shopId,
    title: line.title,
    variantTitle: line.variantTitle,
    image: line.image,
    sku: line.sku,
    unitPricePoisha,
    quantity: line.quantity,
    lineTotalPoisha: multiplyPoisha(unitPricePoisha, line.quantity),
    availability: options.forceUnavailable ? "out_of_stock" : line.availability,
    shopName: line.shopName,
    shopType: line.shopType === "careu" ? "careu" : "marketplace",
    href: line.href,
  };
}

export function createCheckoutDraft(input: DraftInput): DraftResult {
  if (input.source === "cart") {
    if (input.scenario === "empty_selection" || input.lines.length === 0) {
      return { ok: false, failure: failure("selection", "EMPTY_SELECTION", FAILURE_MESSAGE_KEYS.empty, false) };
    }
  }

  const baseItems: CheckoutItemSnapshot[] =
    input.source === "cart" ? input.lines : [{ ...input.resolved, lineId: null }];
  const items = baseItems.map((item, index) =>
    input.scenario === "unavailable_item" && index === 0
      ? { ...item, availability: "out_of_stock" as const }
      : item,
  );

  const identitySource =
    input.source === "cart"
      ? `cart|${items.map((item) => item.lineId ?? "").join("|")}`
      : `buy_now|${input.handoff.productId}:${input.handoff.variantId ?? "-"}:${input.handoff.shopId}:${input.handoff.quantity}`;

  return {
    ok: true,
    draft: {
      draftId: createDraftId(identitySource),
      source: input.source,
      sourceLineIds: input.source === "cart" ? items.map((item) => item.lineId ?? "") : [],
      items,
      addressSelection: null,
      deliveryOptionId: "standard",
      paymentMethodId: "cod",
      scenario: input.scenario,
    },
  };
}

/** Recompute every money value from the snapshot and the selected rule charge. */
export function recomputeTotals(draft: CheckoutDraft, deliveryChargePoisha: Poisha): TotalsResult {
  if (
    draft.items.length === 0 ||
    draft.items.some(
      (item) =>
        typeof item.unitPricePoisha !== "bigint" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    return { ok: false, failure: failure("selection", "MALFORMED_SNAPSHOT", FAILURE_MESSAGE_KEYS.empty, false) };
  }

  const shopGroups = new Map<string, CheckoutShopSummary>();
  let subtotalPoisha = 0n;
  let itemCount = 0;

  for (const item of draft.items) {
    const lineTotal = multiplyPoisha(item.unitPricePoisha, item.quantity);
    subtotalPoisha = sumPoisha([subtotalPoisha, lineTotal]);
    itemCount += item.quantity;

    const group = shopGroups.get(item.shopId) ?? {
      shopId: item.shopId,
      shopName: item.shopName,
      shopType: item.shopType,
      items: [],
      subtotalPoisha: 0n,
    };
    group.items.push(item);
    group.subtotalPoisha = sumPoisha([group.subtotalPoisha, lineTotal]);
    shopGroups.set(item.shopId, group);
  }

  const totals: CheckoutTotals = {
    subtotalPoisha,
    deliveryPoisha: deliveryChargePoisha,
    totalPoisha: sumPoisha([subtotalPoisha, deliveryChargePoisha]),
    itemCount,
    perShopSummary: [...shopGroups.values()],
  };
  return { ok: true, totals };
}

export function hasUnavailableItem(draft: CheckoutDraft): boolean {
  return draft.items.some((item) => item.availability === "out_of_stock");
}

function mockDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 650);
  });
}

function placedAtLabel(locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

/** No stock, payment, or backend write happens here: this only builds a confirmation. */
export async function placeMockOrder(input: {
  draft: CheckoutDraft;
  addressSelection: CheckoutAddressSelection;
  deliveryOption: DeliveryOptionView;
  paymentMethod: PaymentMethodView;
  scenario: CheckoutScenario;
  locale: Locale;
}): Promise<PlacementResult> {
  const { draft, addressSelection, deliveryOption, paymentMethod, scenario, locale } = input;

  if (!addressSelection) {
    return { ok: false, failure: failure("address", "ADDRESS_REQUIRED", "addressRequired", false) };
  }
  if (hasUnavailableItem(draft)) {
    return { ok: false, failure: failure("availability", "UNAVAILABLE_ITEM", FAILURE_MESSAGE_KEYS.unavailable, false) };
  }

  const totalsResult = recomputeTotals(draft, deliveryOption.chargePoisha);
  if (!totalsResult.ok) return { ok: false, failure: totalsResult.failure };

  await mockDelay();

  if (scenario === "payment_failure") {
    return { ok: false, failure: failure("payment", "PAYMENT_FAILED", FAILURE_MESSAGE_KEYS.payment, true) };
  }
  if (scenario === "placement_failure") {
    return { ok: false, failure: failure("placement", "PLACEMENT_FAILED", FAILURE_MESSAGE_KEYS.placement, true) };
  }

  const placedDraft: CheckoutDraft = { ...draft, addressSelection };
  const confirmation: OrderConfirmation = {
    orderNumber: createOrderNumber(placedDraft, deliveryOption.id, paymentMethod.id),
    placedAtLabel: placedAtLabel(locale),
    items: placedDraft.items,
    addressSnapshot: addressSelection,
    deliverySnapshot: deliveryOption,
    paymentSnapshot: paymentMethod,
    totals: totalsResult.totals,
    perShopSummary: totalsResult.totals.perShopSummary,
  };
  return { ok: true, confirmation };
}
