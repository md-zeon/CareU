/**
 * Contracts for the customer account prototype.
 *
 * Everything here is browser side display data. Orders and shipments stay in
 * fixtures, only profile and address edits reach the account store, and every
 * getter takes the acting mock customer id so ownership is rehearsed now.
 */

import type { LocalizedText } from "../types";
import type { Poisha } from "@/lib/money/poisha";

export const ACCOUNT_CUSTOMER_ID = "persona-customer";
export const OTHER_CUSTOMER_ID = "persona-customer-other";

export type ShopType = "careu" | "marketplace";

export type AccountErrorCode = "not_found" | "invalid" | "forbidden" | "storage_error" | "unknown";

export type AccountFieldErrors = Record<string, string[]>;

export type AccountError = {
  code: AccountErrorCode;
  messageKey: string;
  retryable: boolean;
  fieldErrors?: AccountFieldErrors;
};

export type AccountResult<T> = { ok: true; data: T } | { ok: false; error: AccountError };

export type CustomerProfileView = {
  customerId: string;
  name: string;
  phone: string;
  memberSinceLabel: LocalizedText;
  email?: string;
  avatarPath?: string;
};

export type ProfileDraft = {
  name: string;
  phone: string;
  email: string;
};

export type SavedAddressView = {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
  landmark: string;
  isDefault: boolean;
};

export type AddressDraft = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
  landmark: string;
  isDefault: boolean;
};

export type OrderStatusGroup =
  | "pending"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "delivery_exception";

export type ShipmentStatus = OrderStatusGroup;

export type OrderSummaryView = {
  orderNumber: string;
  customerId: string;
  placedAt: string;
  /** Set when the value was already formatted with Intl at checkout time. */
  placedAtLabel?: string;
  statusGroup: OrderStatusGroup;
  totalPoisha: Poisha;
  itemCount: number;
  shopCount: number;
  shipmentCount: number;
  source: "fixture" | "confirmation";
};

export type OrderHistoryTab = {
  status: "all" | OrderStatusGroup;
  count: number;
};

export type OrderHistoryView = {
  tabs: OrderHistoryTab[];
  ordersByTab: Record<string, OrderSummaryView[]>;
};

export type AddressSnapshotView = {
  lines: string[];
};

export type DeliverySnapshotView = {
  label: LocalizedText;
  description: LocalizedText;
  chargePoisha: Poisha;
};

export type PaymentSnapshotView = {
  label: LocalizedText;
  description: LocalizedText;
  method: "cod" | "online";
};

export type ItemSnapshotView = {
  key: string;
  title: LocalizedText;
  variantTitle: LocalizedText | null;
  shopId: string;
  shopName: LocalizedText;
  shopType: ShopType;
  quantity: number;
  unitPricePoisha: Poisha;
  lineTotalPoisha: Poisha;
  image?: string;
};

export type ShopGroupView = {
  shopId: string;
  shopName: LocalizedText;
  shopType: ShopType;
  items: ItemSnapshotView[];
  subtotalPoisha: Poisha;
  shipmentId?: string;
};

export type ShipmentSummaryView = {
  shipmentId: string;
  orderNumber: string;
  shopId: string;
  shopName: LocalizedText;
  shopType: ShopType;
  status: ShipmentStatus;
  trackingNumber?: string;
};

export type OrderDetailView = {
  orderNumber: string;
  customerId: string;
  placedAt: string;
  placedAtLabel?: string;
  statusGroup: OrderStatusGroup;
  addressSnapshot: AddressSnapshotView;
  deliverySnapshot: DeliverySnapshotView;
  paymentSnapshot: PaymentSnapshotView;
  totals: {
    subtotalPoisha: Poisha;
    deliveryPoisha: Poisha;
    totalPoisha: Poisha;
    itemCount: number;
  };
  perShopGroups: ShopGroupView[];
  shipments: ShipmentSummaryView[];
  source: "fixture" | "confirmation";
};

export type ShipmentStatusEvent = {
  eventId: string;
  shipmentId: string;
  status: ShipmentStatus;
  at: string;
  note?: LocalizedText;
  actorLabel?: LocalizedText;
};

export type ShipmentView = ShipmentSummaryView & {
  customerId: string;
  deliveryFeePoisha: Poisha;
  events: ShipmentStatusEvent[];
};

export type TrackingStep = {
  status: ShipmentStatus;
  state: "complete" | "current" | "upcoming" | "stopped";
};

export type TrackingView = {
  shipmentId: string;
  orderNumber: string;
  customerId: string;
  status: ShipmentStatus;
  steps: TrackingStep[];
  timeline: ShipmentStatusEvent[];
  lastUpdateLabel: string;
  deliveryException: boolean;
  trackingNumber?: string;
  shopName: LocalizedText;
  supportHref: string;
};

export type AccountVariant = "default" | "empty" | "invalid" | "not_found" | "loading" | "error" | "exception";

export type AccountScenarioId =
  | "default"
  | "empty_orders"
  | "no_addresses"
  | "invalid_form"
  | "order_not_found"
  | "tracking_not_found"
  | "loading"
  | "error"
  | "shipment_exception";

export type AccountScenario = {
  id: AccountScenarioId;
  profileVariant: AccountVariant;
  addressVariant: AccountVariant;
  orderVariant: AccountVariant;
  shipmentVariant: AccountVariant;
};

export const ORDER_STATUS_GROUPS: OrderStatusGroup[] = [
  "pending",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "delivery_exception",
];

export const TRACKING_STEP_ORDER: ShipmentStatus[] = [
  "pending",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];
