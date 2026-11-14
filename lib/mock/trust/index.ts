import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockDispute, MockReturn, MockReview, MockSupportCase } from "./types";

export * from "./types";

export const mockReviews: MockReview[] = [
  { id: "rev-1", productId: "prod-vivo-y28", authorPersonaId: "persona-customer", rating: 5, title: l("Great value", "দারুণ ভ্যালু"), body: l("Battery lasts long and camera is good for the price.", "ব্যাটারি ভালো চলে এবং দামের তুলনায় ক্যামেরা ভালো।"), status: "published", createdAt: "2026-11-05T10:00:00Z" },
  { id: "rev-2", productId: "prod-cookware", authorPersonaId: "persona-customer", rating: 4, title: l("Solid set", "ভালো সেট"), body: l("Easy to clean and heats evenly.", "পরিষ্কার করা সহজ এবং সমানভাবে গরম হয়।"), status: "published", createdAt: "2026-11-08T12:00:00Z" },
];

export const mockSupportCases: MockSupportCase[] = [
  { id: "case-1", orderId: "order-1001", shipmentId: "ship-2", customerPersonaId: "persona-customer", category: "delivery", priority: "medium", status: "in_progress", summary: l("Shipment delayed by one day", "শিপমেন্ট এক দিন দেরি হয়েছে") },
  { id: "case-2", orderId: "order-1002", customerPersonaId: "persona-customer", category: "payment", priority: "low", status: "resolved", summary: l("Payment confirmation question", "পেমেন্ট নিশ্চিতকরণ নিয়ে প্রশ্ন") },
];

export const mockDisputes: MockDispute[] = [
  { id: "disp-1", orderId: "order-1001", shipmentId: "ship-2", itemId: "oi-2", status: "under_review", reason: l("Item arrived with damaged packaging.", "প্যাকেজিং ক্ষতিগ্রস্ত অবস্থায় এসেছে।"), requestedAmountBdt: 149900 },
];

export const mockReturns: MockReturn[] = [
  { id: "ret-1", orderId: "order-1002", shipmentId: "ship-3", itemId: "oi-3", status: "requested", reason: l("Customer wants a different product.", "ক্রেতা অন্য পণ্য চান।"), requestedAmountBdt: 59000 },
];

export function getMockReviews(options?: ScenarioOptions): ScenarioResult<MockReview[]> {
  return withScenario(mockReviews, { ...options, emptyData: [] });
}
export function getMockSupportCases(options?: ScenarioOptions): ScenarioResult<MockSupportCase[]> {
  return withScenario(mockSupportCases, { ...options, emptyData: [] });
}
export function getMockDisputes(options?: ScenarioOptions): ScenarioResult<MockDispute[]> {
  return withScenario(mockDisputes, { ...options, emptyData: [] });
}
export function getMockReturns(options?: ScenarioOptions): ScenarioResult<MockReturn[]> {
  return withScenario(mockReturns, { ...options, emptyData: [] });
}
