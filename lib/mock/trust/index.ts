import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockDispute, MockReturn, MockReview, MockSupportCase } from "./types";

export * from "./types";

export const mockReviews: MockReview[] = [
  { id: "rev-1", productId: "prod-vivo-y28", authorPersonaId: "persona-customer", rating: 5, title: l("Great value", "দারুণ ভ্যালু"), body: l("Battery lasts long and camera is good for the price.", "ব্যাটারি ভালো চলে এবং দামের তুলনায় ক্যামেরা ভালো।"), status: "published", createdAt: "2026-11-05T10:00:00Z" },
  { id: "rev-1b", productId: "prod-vivo-y28", authorPersonaId: "persona-guest", rating: 4, title: l("Smooth for daily use", "দৈনন্দিন ব্যবহারে মসৃণ"), body: l("Apps run well and the display is comfortable for reading.", "অ্যাপ ভালো চলে এবং পড়ার জন্য ডিসপ্লে আরামদায়ক।"), status: "published", createdAt: "2026-11-07T09:30:00Z" },
  { id: "rev-1c", productId: "prod-vivo-y28", authorPersonaId: "persona-customer", rating: 5, title: l("Happy with purchase", "কিনে খুশি"), body: l("Setup was easy and delivery information was clear in this prototype view.", "সেটআপ সহজ ছিল এবং এই প্রোটোটাইপ ভিউতে ডেলিভারি তথ্য পরিষ্কার ছিল।"), status: "published", createdAt: "2026-11-09T14:15:00Z" },
  { id: "rev-2", productId: "prod-cookware", authorPersonaId: "persona-customer", rating: 4, title: l("Solid set", "ভালো সেট"), body: l("Easy to clean and heats evenly.", "পরিষ্কার করা সহজ এবং সমানভাবে গরম হয়।"), status: "published", createdAt: "2026-11-08T12:00:00Z" },
  { id: "rev-2b", productId: "prod-cookware", authorPersonaId: "persona-guest", rating: 5, title: l("Useful for home cooking", "ঘরোয়া রান্নায় কাজে লাগে"), body: l("Good size pieces for everyday meals.", "দৈনন্দিন খাবারের জন্য ভালো সাইজের পিস।"), status: "published", createdAt: "2026-11-10T08:00:00Z" },
  { id: "rev-3", productId: "prod-fast-charger", authorPersonaId: "persona-customer", rating: 4, title: l("Charges quickly", "দ্রুত চার্জ হয়"), body: l("Compact and convenient for my phone.", "আমার ফোনের জন্য ছোট এবং সুবিধাজনক।"), status: "published", createdAt: "2026-11-06T16:20:00Z" },
  { id: "rev-3b", productId: "prod-fast-charger", authorPersonaId: "persona-guest", rating: 5, title: l("Handy travel charger", "ভ্রমণে কাজে লাগে"), body: l("Takes little space in the bag.", "ব্যাগে খুব কম জায়গা নেয়।"), status: "published", createdAt: "2026-11-11T11:10:00Z" },
  { id: "rev-4", productId: "prod-laptop", authorPersonaId: "persona-customer", rating: 5, title: l("Good for study", "পড়াশোনার জন্য ভালো"), body: l("Lightweight and comfortable for classes and documents.", "ক্লাস ও ডকুমেন্টের জন্য হালকা এবং আরামদায়ক।"), status: "published", createdAt: "2026-11-04T13:45:00Z" },
  { id: "rev-5", productId: "prod-cotton-shirt", authorPersonaId: "persona-customer", rating: 4, title: l("Comfortable fabric", "আরামদায়ক কাপড়"), body: l("Fits well for daily wear.", "দৈনন্দিন পরার জন্য ফিট ভালো।"), status: "published", createdAt: "2026-11-03T10:05:00Z" },
  { id: "rev-6", productId: "prod-cleanser", authorPersonaId: "persona-customer", rating: 4, title: l("Gentle on skin", "ত্বকে নরম"), body: l("Feels fresh after washing.", "ধোয়ার পর ত্বক সতেজ লাগে।"), status: "published", createdAt: "2026-11-02T18:30:00Z" },
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
