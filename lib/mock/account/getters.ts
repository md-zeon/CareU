/** Typed read contract for the account prototype. No HTTP, Prisma, or writes. */

import type { Locale } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/catalog/price";
import { bdtToPoisha, sumPoisha, type Poisha } from "@/lib/money";
import type { OrderConfirmation } from "../checkout";
import { l } from "../types";
import {
  ACCOUNT_CUSTOMER_ID,
  ORDER_STATUS_GROUPS,
  type AccountResult,
  type AddressSnapshotView,
  type CustomerProfileView,
  type DeliverySnapshotView,
  type ItemSnapshotView,
  type OrderDetailView,
  type OrderHistoryView,
  type OrderStatusGroup,
  type OrderSummaryView,
  type PaymentSnapshotView,
  type SavedAddressView,
  type ShipmentView,
  type ShopGroupView,
  type TrackingView,
  type AccountScenario,
} from "./types";
import {
  accountError,
  accountFailure,
  accountNotFound,
  accountSuccess,
  deriveStatusGroup,
  formatAccountDate,
  trackingSteps,
} from "./logic";
import {
  accountPayments,
  accountOrderItems,
  demoShipmentStates,
  mockAccountOrders,
  mockAccountProfiles,
  mockAccountShipments,
  mockDefaultAddresses,
  shopView,
} from "./fixtures";

const ORDERS_PER_TAB = 10;
const ADDRESS_CAP = 6;

export type AccountReadOptions = {
  scenario?: AccountScenario;
  confirmation?: OrderConfirmation | null;
};

function defaultScenario(): AccountScenario {
  return {
    id: "default",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "default",
    shipmentVariant: "default",
  };
}

function storageFailure<T>(messageKey: string): AccountResult<T> {
  return accountFailure(accountError("storage_error", messageKey, true));
}

/** Every customer read starts here, so another persona's id never reaches a view. */
export function isOwnedBy(customerId: string, ownerId: string): boolean {
  return customerId === ownerId;
}

export function getProfile(
  customerId: string,
  scenario: AccountScenario = defaultScenario(),
  stored?: CustomerProfileView | null,
): AccountResult<CustomerProfileView> {
  if (scenario.profileVariant === "error") return storageFailure("errorMessage");
  if (scenario.profileVariant === "empty" || scenario.profileVariant === "not_found") {
    return accountNotFound("profileNotFoundMessage");
  }
  const storedProfile = stored && isOwnedBy(customerId, stored.customerId) ? stored : null;
  if (storedProfile) return accountSuccess(storedProfile);
  const profile = mockAccountProfiles.find((item) => isOwnedBy(customerId, item.customerId));
  if (!profile) return accountNotFound("profileNotFoundMessage");
  return accountSuccess(profile);
}

/** Stored addresses belong to one persona; the merge never crosses that boundary. */
export function listAddresses(
  customerId: string,
  stored: readonly SavedAddressView[],
  scenario: AccountScenario = defaultScenario(),
): AccountResult<SavedAddressView[]> {
  if (scenario.addressVariant === "error") return storageFailure("errorMessage");
  if (scenario.addressVariant === "empty") return accountSuccess([]);
  const owned = stored
    .filter((address) => isOwnedBy(customerId, address.customerId))
    .slice(0, ADDRESS_CAP);
  return accountSuccess(owned);
}

function confirmationSummary(confirmation: OrderConfirmation): OrderSummaryView {
  return {
    orderNumber: confirmation.orderNumber,
    customerId: ACCOUNT_CUSTOMER_ID,
    placedAt: "",
    placedAtLabel: confirmation.placedAtLabel,
    statusGroup: "pending",
    totalPoisha: confirmation.totals.totalPoisha,
    itemCount: confirmation.totals.itemCount,
    shopCount: confirmation.perShopSummary.length,
    shipmentCount: confirmation.perShopSummary.length,
    source: "confirmation",
  };
}

function fixtureSummary(customerId: string, orderNumber: string): OrderSummaryView | null {
  const order = mockAccountOrders.find(
    (item) => item.orderNumber === orderNumber && isOwnedBy(customerId, item.customerPersonaId),
  );
  if (!order) return null;
  const shipments = mockAccountShipments.filter(
    (shipment) => shipment.orderNumber === orderNumber && isOwnedBy(customerId, shipment.customerId),
  );
  const items = accountOrderItems.filter((item) => item.orderId === order.id);
  const shops = new Set(
    shipments.map((shipment) => shipment.shopId).concat(items.map((item) => item.shipmentId)),
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    orderNumber: order.orderNumber,
    customerId,
    placedAt: order.placedAt,
    statusGroup: deriveStatusGroup(shipments),
    totalPoisha: bdtToPoisha(order.grandTotalBdt),
    itemCount,
    shopCount: shipments.length > 0 ? new Set(shipments.map((shipment) => shipment.shopId)).size : shops.size,
    shipmentCount: shipments.length,
    source: "fixture",
  };
}

function allOrderSummaries(customerId: string, options: AccountReadOptions): OrderSummaryView[] {
  const summaries: OrderSummaryView[] = [];
  if (options.confirmation && isOwnedBy(customerId, ACCOUNT_CUSTOMER_ID)) {
    summaries.push(confirmationSummary(options.confirmation));
  }
  for (const order of mockAccountOrders) {
    if (!isOwnedBy(customerId, order.customerPersonaId)) continue;
    const summary = fixtureSummary(customerId, order.orderNumber);
    if (summary && !summaries.some((item) => item.orderNumber === summary.orderNumber)) summaries.push(summary);
  }
  return summaries;
}

export function listOrders(
  customerId: string,
  options: AccountReadOptions = {},
): AccountResult<OrderHistoryView> {
  const scenario = options.scenario ?? defaultScenario();
  if (scenario.orderVariant === "error") return storageFailure("errorMessage");
  if (scenario.orderVariant === "empty" || scenario.orderVariant === "not_found") {
    return accountSuccess(emptyHistory());
  }

  const summaries = allOrderSummaries(customerId, options);
  const ordersByTab: Record<string, OrderSummaryView[]> = { all: summaries.slice(0, ORDERS_PER_TAB) };
  const counts: Record<OrderStatusGroup, number> = {
    pending: 0,
    packed: 0,
    shipped: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    delivery_exception: 0,
  };
  for (const summary of summaries) counts[summary.statusGroup] += 1;

  for (const status of ORDER_STATUS_GROUPS) {
    ordersByTab[status] = summaries
      .filter((summary) => summary.statusGroup === status)
      .slice(0, ORDERS_PER_TAB);
  }

  const tabs = ([{ status: "all" as const, count: summaries.length }] as { status: "all" | OrderStatusGroup; count: number }[]).concat(
    ORDER_STATUS_GROUPS.map((status) => ({ status, count: counts[status] })),
  );
  return accountSuccess({ tabs, ordersByTab });
}

function emptyHistory(): OrderHistoryView {
  const ordersByTab: Record<string, OrderSummaryView[]> = { all: [] };
  for (const status of ORDER_STATUS_GROUPS) ordersByTab[status] = [];
  const tabs = ([{ status: "all" as const, count: 0 }] as { status: "all" | OrderStatusGroup; count: number }[]).concat(
    ORDER_STATUS_GROUPS.map((status) => ({ status, count: 0 })),
  );
  return { tabs, ordersByTab };
}

function fixtureDetail(customerId: string, orderNumber: string): OrderDetailView | null {
  const order = mockAccountOrders.find(
    (item) => item.orderNumber === orderNumber && isOwnedBy(customerId, item.customerPersonaId),
  );
  if (!order) return null;
  const shipments = mockAccountShipments.filter(
    (shipment) => shipment.orderNumber === orderNumber && isOwnedBy(customerId, shipment.customerId),
  );
  const items = accountOrderItems.filter((item) => item.orderId === order.id);
  const shipmentIds = new Set(shipments.map((shipment) => shipment.shipmentId));
  const relevantItems = items.filter((item) => shipmentIds.has(item.shipmentId));

  const groups = new Map<string, ShopGroupView>();
  for (const item of relevantItems) {
    const shipment = shipments.find((entry) => entry.shipmentId === item.shipmentId);
    if (!shipment) continue;
    const group = groups.get(shipment.shopId) ?? {
      shopId: shipment.shopId,
      shopName: shipment.shopName,
      shopType: shipment.shopType,
      items: [],
      subtotalPoisha: 0n,
      shipmentId: shipment.shipmentId,
    };
    const snapshot: ItemSnapshotView = {
      key: item.id,
      title: item.titleSnapshot,
      variantTitle: null,
      shopId: shipment.shopId,
      shopName: shipment.shopName,
      shopType: shipment.shopType,
      quantity: item.quantity,
      unitPricePoisha: bdtToPoisha(item.unitPriceBdt),
      lineTotalPoisha: bdtToPoisha(item.lineTotalBdt),
    };
    group.items.push(snapshot);
    group.subtotalPoisha = sumPoisha([group.subtotalPoisha, snapshot.lineTotalPoisha]);
    groups.set(shipment.shopId, group);
  }

  const subtotalPoisha = sumPoisha(relevantItems.map((item) => bdtToPoisha(item.lineTotalBdt)));
  const deliveryPoisha = sumPoisha(shipments.map((shipment) => shipment.deliveryFeePoisha));
  const payment = accountPayments.find((item) => item.orderId === order.id);
  const method = payment?.method === "online" ? "online" : "cod";

  const address = mockDefaultAddresses.find((item) => isOwnedBy(customerId, item.customerId) && item.isDefault)
    ?? mockDefaultAddresses.find((item) => isOwnedBy(customerId, item.customerId));
  const addressSnapshot: AddressSnapshotView = {
    lines: address
      ? [
          `${address.label} · ${address.recipientName}`,
          `${address.phone}`,
          `${address.addressLine}, ${address.district}`,
        ]
      : [],
  };

  const deliverySnapshot: DeliverySnapshotView = {
    label: l("Standard delivery", "স্ট্যান্ডার্ড ডেলিভারি"),
    description: l("CareU coordinated delivery", "কেয়ারইউ সমন্বিত ডেলিভারি"),
    chargePoisha: deliveryPoisha,
  };
  const paymentSnapshot: PaymentSnapshotView = {
    label:
      method === "cod"
        ? l("Cash on delivery", "ডেলিভারির সময় নগদ")
        : l("Online payment (mock)", "অনলাইন পেমেন্ট (মক)"),
    description:
      method === "cod"
        ? l("CareU collects on delivery", "ডেলিভারির সময় কেয়ারইউ সংগ্রহ করে")
        : l("Paid through the mock gateway", "মক গেটওয়ের মাধ্যমে পরিশোধ"),
    method,
  };

  return {
    orderNumber: order.orderNumber,
    customerId,
    placedAt: order.placedAt,
    statusGroup: deriveStatusGroup(shipments),
    addressSnapshot,
    deliverySnapshot,
    paymentSnapshot,
    totals: {
      subtotalPoisha,
      deliveryPoisha,
      totalPoisha: sumPoisha([subtotalPoisha, deliveryPoisha]),
      itemCount: relevantItems.reduce((sum, item) => sum + item.quantity, 0),
    },
    perShopGroups: [...groups.values()],
    shipments: shipments.map((shipment) => ({
      shipmentId: shipment.shipmentId,
      orderNumber: shipment.orderNumber,
      shopId: shipment.shopId,
      shopName: shipment.shopName,
      shopType: shipment.shopType,
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
    })),
    source: "fixture",
  };
}

function confirmationDetail(confirmation: OrderConfirmation): OrderDetailView {
  const snapshot = confirmation.addressSnapshot;
  const addressLines = snapshot.kind === "saved"
    ? [
        `${snapshot.address.label} · ${snapshot.address.recipientName}`,
        snapshot.address.phone,
        `${snapshot.address.addressLine}, ${snapshot.address.district}`,
      ]
    : [
        `${snapshot.address.recipientName} · ${snapshot.address.phone}`,
        `${snapshot.address.addressLine}, ${snapshot.address.district}`,
      ];
  const shipments = confirmation.perShopSummary.map((shop) => {
    const view = shopView(shop.shopId);
    return {
      shipmentId: `confirmation-${shop.shopId}`,
      orderNumber: confirmation.orderNumber,
      shopId: shop.shopId,
      shopName: view.name,
      shopType: view.type,
      status: "pending" as const,
      trackingNumber: undefined,
    };
  });

  return {
    orderNumber: confirmation.orderNumber,
    customerId: ACCOUNT_CUSTOMER_ID,
    placedAt: "",
    placedAtLabel: confirmation.placedAtLabel,
    statusGroup: "pending",
    addressSnapshot: { lines: addressLines },
    deliverySnapshot: {
      label: confirmation.deliverySnapshot.label,
      description: confirmation.deliverySnapshot.description,
      chargePoisha: confirmation.deliverySnapshot.chargePoisha,
    },
    paymentSnapshot: {
      label: confirmation.paymentSnapshot.label,
      description: confirmation.paymentSnapshot.description,
      method: confirmation.paymentSnapshot.id === "cod" ? "cod" : "online",
    },
    totals: {
      subtotalPoisha: confirmation.totals.subtotalPoisha,
      deliveryPoisha: confirmation.totals.deliveryPoisha,
      totalPoisha: confirmation.totals.totalPoisha,
      itemCount: confirmation.totals.itemCount,
    },
    perShopGroups: confirmation.perShopSummary.map((shop): ShopGroupView => ({
      shopId: shop.shopId,
      shopName: shop.shopName,
      shopType: shop.shopType,
      shipmentId: `confirmation-${shop.shopId}`,
      subtotalPoisha: shop.subtotalPoisha,
      items: shop.items.map((item): ItemSnapshotView => ({
        key: `${item.productId}-${item.variantId ?? "base"}`,
        title: item.title,
        variantTitle: item.variantTitle,
        shopId: item.shopId,
        shopName: item.shopName,
        shopType: item.shopType,
        quantity: item.quantity,
        unitPricePoisha: item.unitPricePoisha,
        lineTotalPoisha: item.lineTotalPoisha,
      })),
    })),
    shipments,
    source: "confirmation",
  };
}

export function getOrderDetail(
  customerId: string,
  orderNumber: string,
  options: AccountReadOptions = {},
): AccountResult<OrderDetailView> {
  const scenario = options.scenario ?? defaultScenario();
  if (scenario.orderVariant === "error") return storageFailure("errorMessage");
  if (scenario.orderVariant === "not_found") return accountNotFound("orderNotFoundMessage");
  if (options.confirmation?.orderNumber === orderNumber && isOwnedBy(customerId, ACCOUNT_CUSTOMER_ID)) {
    return accountSuccess(confirmationDetail(options.confirmation));
  }
  const detail = fixtureDetail(customerId, orderNumber);
  if (!detail) return accountNotFound("orderNotFoundMessage");
  return accountSuccess(detail);
}

function withException(shipment: ShipmentView): ShipmentView {
  const exception = demoShipmentStates.find((item) => item.status === "delivery_exception");
  if (!exception) return shipment;
  return { ...shipment, status: "delivery_exception", events: exception.events };
}

function confirmationShipment(
  confirmation: OrderConfirmation | null | undefined,
  shipmentId: string,
): ShipmentView | null {
  if (!confirmation || !shipmentId.startsWith("confirmation-")) return null;
  const shopId = shipmentId.slice("confirmation-".length);
  const shop = confirmation.perShopSummary.find((item) => item.shopId === shopId);
  if (!shop) return null;
  const view = shopView(shop.shopId);
  return {
    shipmentId,
    orderNumber: confirmation.orderNumber,
    customerId: ACCOUNT_CUSTOMER_ID,
    shopId: shop.shopId,
    shopName: view.name,
    shopType: view.type,
    status: "pending",
    deliveryFeePoisha: confirmation.deliverySnapshot.chargePoisha,
    events: [
      {
        eventId: `${shipmentId}-event-1`,
        shipmentId,
        status: "pending",
        at: "",
        note: l("Mock order confirmed", "মক অর্ডার নিশ্চিত"),
      },
    ],
  };
}

export function getShipment(
  customerId: string,
  shipmentId: string,
  options: AccountReadOptions = {},
): AccountResult<ShipmentView> {
  const scenario = options.scenario ?? defaultScenario();
  if (scenario.shipmentVariant === "error") return storageFailure("errorMessage");
  if (scenario.shipmentVariant === "not_found") return accountNotFound("shipmentNotFoundMessage");
  const confirmation = confirmationShipment(options.confirmation, shipmentId);
  if (confirmation && isOwnedBy(customerId, confirmation.customerId)) {
    return accountSuccess(confirmation);
  }
  const shipment = mockAccountShipments.find(
    (item) => item.shipmentId === shipmentId && isOwnedBy(customerId, item.customerId),
  );
  if (!shipment) return accountNotFound("shipmentNotFoundMessage");
  return accountSuccess(scenario.shipmentVariant === "exception" ? withException(shipment) : shipment);
}

export function getTracking(
  customerId: string,
  shipmentId: string,
  locale: Locale,
  options: AccountReadOptions = {},
): AccountResult<TrackingView> {
  const shipmentResult = getShipment(customerId, shipmentId, options);
  if (!shipmentResult.ok) return accountFailure(shipmentResult.error);
  const shipment = shipmentResult.data;
  const timeline = shipment.events;
  const latest = timeline[timeline.length - 1];
  return accountSuccess({
    shipmentId: shipment.shipmentId,
    orderNumber: shipment.orderNumber,
    customerId: shipment.customerId,
    status: shipment.status,
    steps: trackingSteps(shipment.status),
    timeline,
    lastUpdateLabel: latest
      ? latest.at
        ? formatAccountDate(latest.at, locale)
        : (options.confirmation?.placedAtLabel ?? "")
      : "",
    deliveryException: shipment.status === "delivery_exception",
    trackingNumber: shipment.trackingNumber,
    shopName: shipment.shopName,
    supportHref: `/${locale}/support`,
  });
}

export function getReviewableShipments(customerId: string): ShipmentView[] {
  return demoShipmentStates.filter((shipment) => isOwnedBy(customerId, shipment.customerId));
}

/** Kept here so a caller that needs a formatted total does not reimplement it. */
export function formatAccountMoney(value: Poisha, locale: Locale): string {
  return formatPrice(value, locale);
}
