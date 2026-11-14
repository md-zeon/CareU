import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockPersona } from "./types";

export * from "./types";

export const mockPersonas: MockPersona[] = [
  { id: "persona-guest", kind: "guest", displayName: l("Guest visitor", "অতিথি ভিজিটর"), scopeLabel: l("Browsing without sign in", "সাইন ইন ছাড়া ব্রাউজিং") },
  { id: "persona-customer", kind: "customer", displayName: l("Nadia Rahman", "নাদিয়া রহমান"), contactLabel: "+8801700000000", scopeLabel: l("Signed in customer", "সাইন ইন করা ক্রেতা") },
  { id: "persona-seller-owner", kind: "seller_owner", displayName: l("Urban Thread Owner", "আরবান থ্রেড মালিক"), shopId: "shop-urban", contactLabel: "owner@urban-thread.example", scopeLabel: l("Seller owner, Urban Thread", "বিক্রেতা মালিক, আরবান থ্রেড") },
  { id: "persona-seller-staff", kind: "seller_staff", displayName: l("Shop Staff", "দোকানের স্টাফ"), shopId: "shop-urban", contactLabel: "staff@urban-thread.example", scopeLabel: l("Seller staff, Urban Thread", "বিক্রেতা স্টাফ, আরবান থ্রেড") },
  { id: "persona-platform-admin", kind: "platform", displayName: l("Platform Admin", "প্ল্যাটফর্ম অ্যাডমিন"), platformRole: "platform_admin", scopeLabel: l("Platform administration", "প্ল্যাটফর্ম প্রশাসন") },
  { id: "persona-platform-support", kind: "platform", displayName: l("Support Agent", "সাপোর্ট এজেন্ট"), platformRole: "customer_support", scopeLabel: l("Customer support operations", "কাস্টমার সাপোর্ট অপারেশন") },
];

export function getMockPersonas(options?: ScenarioOptions): ScenarioResult<MockPersona[]> {
  return withScenario(mockPersonas, { ...options, emptyData: [] });
}

export function getMockPersonaById(id: string): MockPersona | null {
  return mockPersonas.find((p) => p.id === id) ?? null;
}
