import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockCommissionSummary, MockInventoryView, MockPayout, MockSettlement } from "./types";

export * from "./types";

export const mockInventoryViews: MockInventoryView[] = [
  { id: "inv-1", shopId: "shop-caru", listingId: "list-vivo-y28-caru", variantId: "var-vivo-y28-128", availableQuantity: 18, reservedQuantity: 2, lowStock: false, movementSummary: l("2 sold today, 10 restocked this week", "আজ ২টি বিক্রি, এই সপ্তাহে ১০টি যোগ হয়েছে") },
  { id: "inv-2", shopId: "shop-urban", listingId: "list-shirt-urban", variantId: "var-shirt-m", availableQuantity: 3, reservedQuantity: 1, lowStock: true, movementSummary: l("Low stock, consider restock", "স্টক কম, পুনরায় স্টক করুন") },
];

export const mockPayouts: MockPayout[] = [
  { id: "payout-1", shopId: "shop-urban", periodLabel: l("Nov 1–7, 2026", "১–৭ নভেম্বর ২০২৬"), status: "paid", amountBdt: 2450000, methodLabel: l("Bank transfer", "ব্যাংক ট্রান্সফার"), reference: "BNK-UT-001" },
  { id: "payout-2", shopId: "shop-homecraft", periodLabel: l("Nov 8–14, 2026", "৮–১৪ নভেম্বর ২০২৬"), status: "pending", amountBdt: 890000, methodLabel: l("Mobile wallet", "মোবাইল ওয়ালেট") },
];

export const mockSettlements: MockSettlement[] = [
  { id: "set-1", shopId: "shop-urban", periodLabel: l("Nov 1–7, 2026", "১–৭ নভেম্বর ২০২৬"), status: "settled", amountBdt: 2450000, orderRefs: ["order-1001"] },
  { id: "set-2", shopId: "shop-homecraft", periodLabel: l("Nov 8–14, 2026", "৮–১৪ নভেম্বর ২০২৬"), status: "ready", amountBdt: 890000, orderRefs: ["order-1001"] },
];

export const mockCommissionSummaries: MockCommissionSummary[] = [
  { id: "comm-1", shopId: "shop-urban", orderId: "order-1001", basis: l("Eligible delivered items", "যোগ্য ডেলিভার্ড আইটেম"), rateLabel: "8%", amountBdt: 11992 },
  { id: "comm-2", shopId: "shop-homecraft", orderId: "order-1001", basis: l("Eligible delivered items", "যোগ্য ডেলিভার্ড আইটেম"), rateLabel: "10%", amountBdt: 14990 },
];

export function getMockInventoryViews(options?: ScenarioOptions): ScenarioResult<MockInventoryView[]> {
  return withScenario(mockInventoryViews, { ...options, emptyData: [] });
}
export function getMockPayouts(options?: ScenarioOptions): ScenarioResult<MockPayout[]> {
  return withScenario(mockPayouts, { ...options, emptyData: [] });
}
export function getMockSettlements(options?: ScenarioOptions): ScenarioResult<MockSettlement[]> {
  return withScenario(mockSettlements, { ...options, emptyData: [] });
}
export function getMockCommissionSummaries(options?: ScenarioOptions): ScenarioResult<MockCommissionSummary[]> {
  return withScenario(mockCommissionSummaries, { ...options, emptyData: [] });
}
