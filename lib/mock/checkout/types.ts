/**
 * Types for the browser only checkout prototype.
 *
 * This is display state, not a database model. Money is integer poisha as a
 * bigint, text carried from mocks stays localized until a surface picks a
 * locale, and no value here is persisted except the last confirmation through
 * the explicit session storage helpers.
 */

import type { LocalizedText } from "@/lib/mock/types";
import type { Poisha } from "@/lib/money/poisha";

export type CheckoutSource = "cart" | "buy_now";

export type CheckoutScenario =
  | "default"
  | "empty_selection"
  | "no_address"
  | "unavailable_item"
  | "payment_failure"
  | "placement_failure";

export type CheckoutFailureStage = "selection" | "address" | "availability" | "payment" | "placement";

export type CheckoutFailure = {
  stage: CheckoutFailureStage;
  code: string;
  /** A key inside the `Checkout` message namespace. */
  messageKey: string;
  retryable: boolean;
};

export type CheckoutShopType = "careu" | "marketplace";
export type CheckoutAvailability = "in_stock" | "low_stock" | "out_of_stock";

export type CheckoutItemSnapshot = {
  lineId: string | null;
  productId: string;
  variantId: string | null;
  shopId: string;
  title: LocalizedText;
  variantTitle: LocalizedText | null;
  image: string;
  sku: string | null;
  unitPricePoisha: Poisha;
  quantity: number;
  lineTotalPoisha: Poisha;
  availability: CheckoutAvailability;
  shopName: LocalizedText;
  shopType: CheckoutShopType;
  href: string;
};

export type CheckoutAddressView = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
  /** Stable key used by the mock delivery rule table. */
  districtKey: string;
  isDefault?: boolean;
};

export type InlineAddressDraft = {
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
};

export type CheckoutAddressSelection =
  | { kind: "saved"; address: CheckoutAddressView }
  | { kind: "inline"; address: InlineAddressDraft };

export type DeliveryOptionView = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  chargePoisha: Poisha;
  /** True when the destination had no explicit rule and the fallback applied. */
  usesFallback: boolean;
};

export type PaymentMethodView = {
  id: "cod" | "online_mock";
  label: LocalizedText;
  description: LocalizedText;
  showsMockGateway: boolean;
};

export type CheckoutShopSummary = {
  shopId: string;
  shopName: LocalizedText;
  shopType: CheckoutShopType;
  items: CheckoutItemSnapshot[];
  subtotalPoisha: Poisha;
};

export type CheckoutTotals = {
  subtotalPoisha: Poisha;
  deliveryPoisha: Poisha;
  totalPoisha: Poisha;
  itemCount: number;
  perShopSummary: CheckoutShopSummary[];
};

export type CheckoutDraft = {
  draftId: string;
  source: CheckoutSource;
  sourceLineIds: string[];
  items: CheckoutItemSnapshot[];
  addressSelection: CheckoutAddressSelection | null;
  deliveryOptionId: string;
  paymentMethodId: string;
  scenario: CheckoutScenario;
};

export type OrderConfirmation = {
  orderNumber: string;
  placedAtLabel: string;
  items: CheckoutItemSnapshot[];
  addressSnapshot: CheckoutAddressSelection;
  deliverySnapshot: DeliveryOptionView;
  paymentSnapshot: PaymentMethodView;
  totals: CheckoutTotals;
  perShopSummary: CheckoutShopSummary[];
};

export type BuyNowHandoff = {
  productId: string;
  variantId: string | null;
  shopId: string;
  quantity: number;
};

export type DraftInput =
  | {
      source: "cart";
      /** Selected lines from the shared store, resolved before this call. */
      lines: CheckoutItemSnapshot[];
      scenario: CheckoutScenario;
    }
  | {
      source: "buy_now";
      handoff: BuyNowHandoff;
      resolved: CheckoutItemSnapshot;
      scenario: CheckoutScenario;
    };

export type DraftResult =
  | { ok: true; draft: CheckoutDraft }
  | { ok: false; failure: CheckoutFailure };

export type TotalsResult =
  | { ok: true; totals: CheckoutTotals }
  | { ok: false; failure: CheckoutFailure };

export type PlacementResult =
  | { ok: true; confirmation: OrderConfirmation }
  | { ok: false; failure: CheckoutFailure };
