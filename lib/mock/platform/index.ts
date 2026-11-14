import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockAnalyticsCard, MockContentBlock, MockDeliveryAssignment, MockModerationItem, MockNotification } from "./types";

export * from "./types";

export const mockModerationItems: MockModerationItem[] = [
  { id: "mod-1", targetType: "seller_application", targetId: "app-2", status: "pending", reason: l("New individual seller application", "নতুন ব্যক্তিগত বিক্রেতা আবেদন"), submittedAt: "2026-11-10T09:00:00Z" },
  { id: "mod-2", targetType: "listing", targetId: "list-shirt-urban", status: "flagged", reason: l("Price and attributes need review", "দাম ও বৈশিষ্ট্য পর্যালোচনা প্রয়োজন"), submittedAt: "2026-11-11T08:30:00Z" },
];

export const mockDeliveryAssignments: MockDeliveryAssignment[] = [
  { id: "da-1", shipmentId: "ship-2", assigneeLabel: l("Courier: Rahim", "কুরিয়ার: রহিম"), status: "assigned", scheduledAt: "2026-11-14T10:00:00Z", updatedAt: "2026-11-13T16:00:00Z" },
  { id: "da-2", shipmentId: "ship-3", assigneeLabel: l("Staff: CareU Delivery", "স্টাফ: কেয়ারইউ ডেলিভারি"), status: "completed", updatedAt: "2026-11-13T11:00:00Z" },
];

export const mockNotifications: MockNotification[] = [
  { id: "noti-1", audience: "customer", personaId: "persona-customer", channel: "in_app", title: l("Order shipped", "অর্ডার শিপ হয়েছে"), body: l("Your cookware shipment is on the way.", "আপনার কুকওয়্যার শিপমেন্ট পথে আছে।"), status: "unread" },
  { id: "noti-2", audience: "seller", personaId: "persona-seller-owner", channel: "email", title: l("Payout processed", "পেআউট সম্পন্ন হয়েছে"), body: l("Your latest payout batch was marked paid.", "আপনার সর্বশেষ পেআউট ব্যাচ পেইড হিসেবে চিহ্নিত হয়েছে।"), status: "sent" },
];

export const mockContentBlocks: MockContentBlock[] = [
  { id: "content-home-hero", key: "home.hero", scope: "home", title: l("Everyday shopping for Bangladesh", "বাংলাদেশের দৈনন্দিন কেনাকাটা"), body: l("Discover trusted sellers and CareU picks in one place.", "বিশ্বস্ত বিক্রেতা এবং কেয়ারইউ পছন্দ এক জায়গায় খুঁজুন।"), status: "published" },
  { id: "content-policy-returns", key: "policy.returns", scope: "policy", title: l("Returns and refunds", "রিটার্ন ও রিফান্ড"), body: l("Return eligibility and refund steps will appear here.", "রিটার্নের যোগ্যতা ও রিফান্ডের ধাপ এখানে দেখানো হবে।"), status: "draft" },
];

export const mockAnalyticsCards: MockAnalyticsCard[] = [
  { id: "an-1", key: "seller.sales", title: l("Seller sales", "বিক্রেতার বিক্রি"), value: "৳24,500", periodLabel: l("Last 7 days", "গত ৭ দিন"), status: "up" },
  { id: "an-2", key: "platform.orders", title: l("Platform orders", "প্ল্যাটফর্ম অর্ডার"), value: 128, periodLabel: l("Last 7 days", "গত ৭ দিন"), status: "neutral" },
  { id: "an-3", key: "careu.margin", title: l("CareU margin view", "কেয়ারইউ মার্জিন ভিউ"), value: "Prototype", periodLabel: l("Separated from seller data", "বিক্রেতার ডাটা থেকে আলাদা"), status: "neutral" },
];

export function getMockModerationItems(options?: ScenarioOptions): ScenarioResult<MockModerationItem[]> {
  return withScenario(mockModerationItems, { ...options, emptyData: [] });
}
export function getMockDeliveryAssignments(options?: ScenarioOptions): ScenarioResult<MockDeliveryAssignment[]> {
  return withScenario(mockDeliveryAssignments, { ...options, emptyData: [] });
}
export function getMockNotifications(options?: ScenarioOptions): ScenarioResult<MockNotification[]> {
  return withScenario(mockNotifications, { ...options, emptyData: [] });
}
export function getMockContentBlocks(options?: ScenarioOptions): ScenarioResult<MockContentBlock[]> {
  return withScenario(mockContentBlocks, { ...options, emptyData: [] });
}
export function getMockAnalyticsCards(options?: ScenarioOptions): ScenarioResult<MockAnalyticsCard[]> {
  return withScenario(mockAnalyticsCards, { ...options, emptyData: [] });
}
