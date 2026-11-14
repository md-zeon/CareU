import type { LocalizedText } from "../types";

export type MockOrder = {
  id: string;
  orderNumber: string;
  customerPersonaId: string;
  placedAt: string;
  overallStatus: "pending" | "confirmed" | "partially_fulfilled" | "delivered" | "cancelled";
  paymentMethod: "cod" | "online";
  itemSubtotalBdt: number;
  deliveryTotalBdt: number;
  grandTotalBdt: number;
  currency: "BDT";
};

export type MockShipment = {
  id: string;
  orderId: string;
  shopId: string;
  status: "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
  trackingCode?: string;
  deliveryFeeBdt: number;
  proofOfDeliveryRef?: string;
  statusHistory: { status: string; at: string; note?: LocalizedText }[];
};

export type MockOrderItem = {
  id: string;
  orderId: string;
  shipmentId: string;
  listingId: string;
  variantId?: string;
  titleSnapshot: LocalizedText;
  quantity: number;
  unitPriceBdt: number;
  lineTotalBdt: number;
};

export type MockPayment = {
  id: string;
  orderId: string;
  method: "cod" | "online";
  status: "pending" | "authorized" | "paid" | "failed" | "refunded";
  amountBdt: number;
  reference?: string;
};

export type MockCodView = {
  id: string;
  shipmentId?: string;
  orderId?: string;
  collectionStatus: "pending" | "collected" | "remitted" | "reconciled" | "discrepancy";
  amountBdt: number;
  notes?: LocalizedText;
};
