import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockCodView, MockOrder, MockOrderItem, MockPayment, MockShipment } from "./types";

export * from "./types";

export const mockOrders: MockOrder[] = [
  { id: "order-1001", orderNumber: "CU-1001", customerPersonaId: "persona-customer", placedAt: "2026-11-10T09:30:00Z", overallStatus: "partially_fulfilled", paymentMethod: "cod", itemSubtotalBdt: 2849800, deliveryTotalBdt: 12000, grandTotalBdt: 2861800, currency: "BDT" },
  { id: "order-1002", orderNumber: "CU-1002", customerPersonaId: "persona-customer", placedAt: "2026-11-12T14:15:00Z", overallStatus: "delivered", paymentMethod: "online", itemSubtotalBdt: 59000, deliveryTotalBdt: 6000, grandTotalBdt: 65000, currency: "BDT" },
];

export const mockShipments: MockShipment[] = [
  { id: "ship-1", orderId: "order-1001", shopId: "shop-caru", status: "delivered", trackingCode: "TRK-CARU-001", deliveryFeeBdt: 6000, proofOfDeliveryRef: "pod-1", statusHistory: [{ status: "packed", at: "2026-11-10T12:00:00Z" }, { status: "delivered", at: "2026-11-11T15:00:00Z", note: l("Received by customer", "ক্রেতা গ্রহণ করেছেন") }] },
  { id: "ship-2", orderId: "order-1001", shopId: "shop-homecraft", status: "shipped", trackingCode: "TRK-HC-002", deliveryFeeBdt: 6000, statusHistory: [{ status: "packed", at: "2026-11-10T13:00:00Z" }, { status: "shipped", at: "2026-11-11T09:00:00Z" }] },
  { id: "ship-3", orderId: "order-1002", shopId: "shop-caru", status: "delivered", trackingCode: "TRK-CARU-003", deliveryFeeBdt: 6000, proofOfDeliveryRef: "pod-3", statusHistory: [{ status: "delivered", at: "2026-11-13T11:00:00Z" }] },
];

export const mockOrderItems: MockOrderItem[] = [
  { id: "oi-1", orderId: "order-1001", shipmentId: "ship-1", listingId: "list-vivo-y28-caru", variantId: "var-vivo-y28-128", titleSnapshot: l("Vivo Y28 5G (128 GB)", "ভিভো ওয়াই২৮ ৫জি (১২৮ জিবি)"), quantity: 1, unitPriceBdt: 2699900, lineTotalBdt: 2699900 },
  { id: "oi-2", orderId: "order-1001", shipmentId: "ship-2", listingId: "list-cookware-home", variantId: "var-cookware-6", titleSnapshot: l("Non-stick Cookware Set", "নন-স্টিক কুকওয়্যার সেট"), quantity: 1, unitPriceBdt: 149900, lineTotalBdt: 149900 },
  { id: "oi-3", orderId: "order-1002", shipmentId: "ship-3", listingId: "list-cleanser-caru", variantId: "var-cleanser-150", titleSnapshot: l("Gentle Foaming Cleanser", "জেন্টল ফোমিং ক্লিনজার"), quantity: 1, unitPriceBdt: 59000, lineTotalBdt: 59000 },
];

export const mockPayments: MockPayment[] = [
  { id: "pay-1", orderId: "order-1001", method: "cod", status: "pending", amountBdt: 2861800 },
  { id: "pay-2", orderId: "order-1002", method: "online", status: "paid", amountBdt: 65000, reference: "SSL-PAID-1002" },
];

export const mockCodViews: MockCodView[] = [
  { id: "cod-1", shipmentId: "ship-1", orderId: "order-1001", collectionStatus: "collected", amountBdt: 2705900, notes: l("Collected by delivery staff.", "ডেলিভারি স্টাফ সংগ্রহ করেছেন।") },
  { id: "cod-2", shipmentId: "ship-2", orderId: "order-1001", collectionStatus: "pending", amountBdt: 155900, notes: l("Awaiting delivery and collection.", "ডেলিভারি ও সংগ্রহের অপেক্ষায়।") },
];

export function getMockOrders(options?: ScenarioOptions): ScenarioResult<MockOrder[]> {
  return withScenario(mockOrders, { ...options, emptyData: [] });
}
export function getMockShipments(options?: ScenarioOptions): ScenarioResult<MockShipment[]> {
  return withScenario(mockShipments, { ...options, emptyData: [] });
}
export function getMockOrderItems(options?: ScenarioOptions): ScenarioResult<MockOrderItem[]> {
  return withScenario(mockOrderItems, { ...options, emptyData: [] });
}
export function getMockPayments(options?: ScenarioOptions): ScenarioResult<MockPayment[]> {
  return withScenario(mockPayments, { ...options, emptyData: [] });
}
export function getMockCodViews(options?: ScenarioOptions): ScenarioResult<MockCodView[]> {
  return withScenario(mockCodViews, { ...options, emptyData: [] });
}
