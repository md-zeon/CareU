import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockSellerApplication, MockSellerStaff, MockShop } from "./types";

export * from "./types";

export const mockShops: MockShop[] = [
  { id: "shop-caru", slug: "careu", name: l("CareU", "কেয়ারইউ"), type: "careu", status: "active", logo: "/products/product-1.svg", rating: 4.8 },
  { id: "shop-urban", slug: "urban-thread", name: l("Urban Thread", "আরবান থ্রেড"), type: "third_party", status: "active", logo: "/products/product-3.svg", rating: 4.4 },
  { id: "shop-homecraft", slug: "homecraft", name: l("HomeCraft", "হোমক্রাফট"), type: "third_party", status: "paused", logo: "/products/product-2.svg", rating: 4.5 },
];

export const mockSellerApplications: MockSellerApplication[] = [
  { id: "app-1", applicantPersonaId: "persona-seller-owner", type: "business", status: "approved", submittedAt: "2026-10-01T10:00:00Z", documentRefs: ["doc-trade-license", "doc-nid"], reviewNotes: l("Approved after document check.", "ডকুমেন্ট যাচাইয়ের পর অনুমোদিত।") },
  { id: "app-2", applicantPersonaId: "persona-seller-staff", type: "individual", status: "submitted", submittedAt: "2026-11-10T09:00:00Z", documentRefs: ["doc-nid-selfie"], reviewNotes: l("Waiting for review.", "পর্যালোচনার অপেক্ষায়।") },
];

export const mockSellerStaff: MockSellerStaff[] = [
  { id: "staff-1", shopId: "shop-urban", personaId: "persona-seller-owner", roleLabel: l("Owner", "মালিক"), status: "active" },
  { id: "staff-2", shopId: "shop-urban", personaId: "persona-seller-staff", roleLabel: l("Catalog manager", "ক্যাটালগ ম্যানেজার"), status: "active" },
];

export function getMockShops(options?: ScenarioOptions): ScenarioResult<MockShop[]> {
  return withScenario(mockShops, { ...options, emptyData: [] });
}
export function getMockSellerApplications(options?: ScenarioOptions): ScenarioResult<MockSellerApplication[]> {
  return withScenario(mockSellerApplications, { ...options, emptyData: [] });
}
export function getMockSellerStaff(options?: ScenarioOptions): ScenarioResult<MockSellerStaff[]> {
  return withScenario(mockSellerStaff, { ...options, emptyData: [] });
}
