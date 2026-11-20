/** Representative fixtures for the customer account prototype. No backend writes. */

import { bdtToPoisha } from "@/lib/money";
import { l, type LocalizedText } from "../types";
import { mockOrders, mockOrderItems, mockPayments, mockShipments, type MockOrder } from "../orders";
import { mockShops } from "../shops";
import {
  ACCOUNT_CUSTOMER_ID,
  ORDER_STATUS_GROUPS,
  OTHER_CUSTOMER_ID,
  TRACKING_STEP_ORDER,
  type CustomerProfileView,
  type SavedAddressView,
  type ShipmentStatus,
  type ShipmentStatusEvent,
  type ShipmentView,
  type ShopType,
} from "./types";

export const accountCustomerIds: string[] = [ACCOUNT_CUSTOMER_ID, OTHER_CUSTOMER_ID];

export const mockAccountProfiles: CustomerProfileView[] = [
  {
    customerId: ACCOUNT_CUSTOMER_ID,
    name: "Nadia Rahman",
    phone: "+8801700000000",
    email: "nadia@example.com",
    memberSinceLabel: l("2025", "২০২৫"),
  },
  {
    customerId: OTHER_CUSTOMER_ID,
    name: "Tasnim Ahmed",
    phone: "+8801811111111",
    email: "tasnim@example.com",
    memberSinceLabel: l("2026", "২০২৬"),
  },
];

export const mockDefaultAddresses: SavedAddressView[] = [
  {
    id: "addr-home",
    customerId: ACCOUNT_CUSTOMER_ID,
    label: "Home",
    recipientName: "Nadia Rahman",
    phone: "+8801700000000",
    addressLine: "12 Green Road, Dhanmondi",
    district: "Dhaka",
    landmark: "Near Dhanmondi Lake",
    isDefault: true,
  },
  {
    id: "addr-office",
    customerId: ACCOUNT_CUSTOMER_ID,
    label: "Office",
    recipientName: "Nadia Rahman",
    phone: "+8801700000000",
    addressLine: "44 Software Park, Banani",
    district: "Dhaka",
    landmark: "Beside the metro station",
    isDefault: false,
  },
  {
    id: "addr-family",
    customerId: ACCOUNT_CUSTOMER_ID,
    label: "Family",
    recipientName: "Rahim Ahmed",
    phone: "+8801712345678",
    addressLine: "7 Station Road",
    district: "Chattogram",
    landmark: "",
    isDefault: false,
  },
  {
    id: "addr-other",
    customerId: OTHER_CUSTOMER_ID,
    label: "Other customer home",
    recipientName: "Tasnim Ahmed",
    phone: "+8801811111111",
    addressLine: "9 Lake View",
    district: "Sylhet",
    landmark: "",
    isDefault: true,
  },
];

/** One order owned by another mock customer proves ownership filtering in the UI. */
const otherCustomerOrder: MockOrder = {
  id: "order-2000",
  orderNumber: "CU-2000",
  customerPersonaId: OTHER_CUSTOMER_ID,
  placedAt: "2026-11-08T10:00:00Z",
  overallStatus: "confirmed",
  paymentMethod: "online",
  itemSubtotalBdt: 12500,
  deliveryTotalBdt: 600,
  grandTotalBdt: 13100,
  currency: "BDT",
};

export const mockAccountOrders: MockOrder[] = [...mockOrders, otherCustomerOrder];
export const accountOrderItems = mockOrderItems;
export const accountPayments = mockPayments;

export function shopView(shopId: string): { name: LocalizedText; type: ShopType } {
  const shop = mockShops.find((item) => item.id === shopId);
  if (!shop) return { name: l(shopId, shopId), type: "marketplace" };
  return { name: shop.name, type: shop.type === "careu" ? "careu" : "marketplace" };
}

function normalizeStatus(value: string): ShipmentStatus {
  if ((ORDER_STATUS_GROUPS as string[]).includes(value)) return value as ShipmentStatus;
  return "pending";
}

function eventsFromHistory(
  shipmentId: string,
  history: { status: string; at: string; note?: LocalizedText }[],
): ShipmentStatusEvent[] {
  return history.map((entry, index) => ({
    eventId: `${shipmentId}-event-${index + 1}`,
    shipmentId,
    status: normalizeStatus(entry.status),
    at: entry.at,
    note: entry.note,
  }));
}

const fixtureShipments: ShipmentView[] = mockShipments.map((shipment) => {
  const order = mockAccountOrders.find((item) => item.id === shipment.orderId);
  const shop = shopView(shipment.shopId);
  return {
    shipmentId: shipment.id,
    orderNumber: order?.orderNumber ?? "CU-UNKNOWN",
    customerId: order?.customerPersonaId ?? ACCOUNT_CUSTOMER_ID,
    shopId: shipment.shopId,
    shopName: shop.name,
    shopType: shop.type,
    status: normalizeStatus(shipment.status),
    trackingNumber: shipment.trackingCode,
    deliveryFeePoisha: bdtToPoisha(shipment.deliveryFeeBdt),
    events: eventsFromHistory(shipment.id, shipment.statusHistory),
  };
});

/** Seven reviewable states reached from the tracking page and prototype switcher. */
function demoEvents(status: ShipmentStatus, shipmentId: string): ShipmentStatusEvent[] {
  const index = TRACKING_STEP_ORDER.indexOf(status);
  const reached = index >= 0 ? TRACKING_STEP_ORDER.slice(0, index + 1) : TRACKING_STEP_ORDER.slice(0, 3);
  const events: ShipmentStatusEvent[] = reached.map((step, stepIndex) => ({
    eventId: `${shipmentId}-event-${stepIndex + 1}`,
    shipmentId,
    status: step,
    at: `2026-11-${String(10 + stepIndex).padStart(2, "0")}T09:00:00Z`,
  }));
  if (status === "cancelled") {
    events.push({
      eventId: `${shipmentId}-event-terminal`,
      shipmentId,
      status,
      at: "2026-11-14T10:30:00Z",
      note: l("Shipment cancelled before dispatch", "চালান প্রেরণের আগে বাতিল"),
      actorLabel: l("CareU operations", "কেয়ারইউ অপারেশন"),
    });
  }
  if (status === "delivery_exception") {
    events.push({
      eventId: `${shipmentId}-event-terminal`,
      shipmentId,
      status,
      at: "2026-11-14T16:45:00Z",
      note: l("Customer was unavailable at the delivery address", "ডেলিভারি ঠিকানায় ক্রেতা উপলব্ধ ছিলেন না"),
      actorLabel: l("Delivery partner", "ডেলিভারি পার্টনার"),
    });
  }
  return events;
}

export const demoShipmentStates: ShipmentView[] = ORDER_STATUS_GROUPS.map((status) => {
  const shipmentId = `demo-${status.replace(/_/g, "-")}`;
  const shop = shopView("shop-caru");
  return {
    shipmentId,
    orderNumber: "CU-DEMO-STATES",
    customerId: ACCOUNT_CUSTOMER_ID,
    shopId: "shop-caru",
    shopName: shop.name,
    shopType: shop.type,
    status,
    trackingNumber: `TRK-DEMO-${status.toUpperCase()}`,
    deliveryFeePoisha: bdtToPoisha(60),
    events: demoEvents(status, shipmentId),
  };
});

const otherCustomerShipment: ShipmentView = {
  shipmentId: "ship-other",
  orderNumber: "CU-2000",
  customerId: OTHER_CUSTOMER_ID,
  shopId: "shop-urban",
  shopName: shopView("shop-urban").name,
  shopType: "marketplace",
  status: "shipped",
  trackingNumber: "TRK-OTHER-2000",
  deliveryFeePoisha: bdtToPoisha(60),
  events: eventsFromHistory("ship-other", [{ status: "shipped", at: "2026-11-09T08:00:00Z" }]),
};

export const mockAccountShipments: ShipmentView[] = [
  ...fixtureShipments,
  ...demoShipmentStates,
  otherCustomerShipment,
];
