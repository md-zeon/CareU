import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, withScenario } from "../types";
import type { MockAddress, MockCart, MockWishlist } from "./types";

export * from "./types";

export const mockAddresses: MockAddress[] = [
  { id: "addr-home", personaId: "persona-customer", label: l("Home", "বাসা"), recipientName: "Nadia Rahman", phone: "+8801700000000", line1: l("House 12, Road 5", "বাড়ি ১২, রোড ৫"), line2: l("Dhanmondi", "ধানমন্ডি"), district: l("Dhaka", "ঢাকা"), area: l("Dhanmondi", "ধানমন্ডি"), isDefault: true },
  { id: "addr-office", personaId: "persona-customer", label: l("Office", "অফিস"), recipientName: "Nadia Rahman", phone: "+8801700000000", line1: l("Level 6, Tower A", "লেভেল ৬, টাওয়ার এ"), line2: l("Banani", "বনানী"), district: l("Dhaka", "ঢাকা"), area: l("Banani", "বনানী"), isDefault: false },
];

export const mockCarts: MockCart[] = [
  {
    id: "cart-customer",
    personaId: "persona-customer",
    items: [
      { id: "cart-item-1", cartId: "cart-customer", listingId: "list-vivo-y28-caru", variantId: "var-vivo-y28-128", shopId: "shop-caru", quantity: 1, unitPriceBdt: 2699900, lineTotalBdt: 2699900, title: l("Vivo Y28 5G (128 GB)", "ভিভো ওয়াই২৮ ৫জি (১২৮ জিবি)"), image: "/products/product-1.svg" },
      { id: "cart-item-2", cartId: "cart-customer", listingId: "list-charger-caru", variantId: "var-charger-white", shopId: "shop-caru", quantity: 2, unitPriceBdt: 149900, lineTotalBdt: 299800, title: l("65W Fast Charger", "৬৫ ওয়াট ফাস্ট চার্জার"), image: "/products/product-2.svg" },
    ],
    subtotalBdt: 2999700,
    deliveryEstimateBdt: 8000,
    totalBdt: 3007700,
  },
  { id: "cart-empty", personaId: "persona-guest", items: [], subtotalBdt: 0, totalBdt: 0 },
];

export const mockWishlists: MockWishlist[] = [
  {
    id: "wish-customer",
    personaId: "persona-customer",
    items: [
      { id: "wish-1", listingId: "list-laptop-caru", productId: "prod-laptop", title: l("Core i5 14\" Laptop", "কোর i5 ১৪\" ল্যাপটপ"), priceBdt: 7299900, image: "/products/product-1.svg" },
      { id: "wish-2", listingId: "list-cookware-home", productId: "prod-cookware", title: l("Non-stick Cookware Set", "নন-স্টিক কুকওয়্যার সেট"), priceBdt: 349900, image: "/products/product-1.svg" },
    ],
  },
  { id: "wish-empty", personaId: "persona-guest", items: [] },
];

export function getMockCarts(options?: ScenarioOptions): ScenarioResult<MockCart[]> {
  return withScenario(mockCarts, { ...options, emptyData: [] });
}
export function getMockAddresses(options?: ScenarioOptions & { personaId?: string }): ScenarioResult<MockAddress[]> {
  const data = options?.personaId ? mockAddresses.filter((a) => a.personaId === options.personaId) : mockAddresses;
  return withScenario(data, { ...options, emptyData: [] });
}
export function getMockWishlists(options?: ScenarioOptions): ScenarioResult<MockWishlist[]> {
  return withScenario(mockWishlists, { ...options, emptyData: [] });
}
export function getMockCartByPersona(personaId: string): MockCart | null {
  return mockCarts.find((c) => c.personaId === personaId) ?? null;
}
