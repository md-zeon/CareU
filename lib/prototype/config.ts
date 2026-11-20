import { l } from "@/lib/mock/types";
import type { PrototypeJourneyShortcut, PrototypePersonaOption, PrototypeSession } from "./types";

export const PROTOTYPE_SESSION_STORAGE_KEY = "careu.prototype.session";
export const PROTOTYPE_SESSION_VERSION = 1;

export const prototypePersonaOptions: PrototypePersonaOption[] = [
  {
    id: "guest",
    label: l("Guest", "অতিথি"),
    kind: "guest",
    description: l("Browsing without sign in", "সাইন ইন ছাড়া ব্রাউজিং"),
    journeyScope: "guest",
  },
  {
    id: "customer",
    label: l("Signed in customer", "সাইন ইন করা ক্রেতা"),
    kind: "customer",
    description: l("Nadia Rahman, customer view", "নাদিয়া রহমান, ক্রেতা ভিউ"),
    mockPersonaId: "persona-customer",
    journeyScope: "customer",
  },
  {
    id: "seller-owner",
    label: l("Seller owner", "বিক্রেতা মালিক"),
    kind: "seller",
    description: l("Urban Thread owner view", "আরবান থ্রেড মালিক ভিউ"),
    mockPersonaId: "persona-seller-owner",
    shopId: "shop-urban",
    journeyScope: "seller",
  },
  {
    id: "seller-staff",
    label: l("Seller staff", "বিক্রেতা স্টাফ"),
    kind: "seller",
    description: l("Urban Thread staff view", "আরবান থ্রেড স্টাফ ভিউ"),
    mockPersonaId: "persona-seller-staff",
    shopId: "shop-urban",
    journeyScope: "seller",
  },
  {
    id: "careu-shop-staff",
    label: l("CareU shop staff", "কেয়ারইউ দোকান স্টাফ"),
    kind: "seller",
    description: l("CareU first party shop staff view", "কেয়ারইউ প্রথম পক্ষের দোকান স্টাফ ভিউ"),
    mockPersonaId: "persona-careu-shop-staff",
    shopId: "shop-careu",
    journeyScope: "seller",
  },
  {
    id: "platform-admin",
    label: l("Platform admin", "প্ল্যাটফর্ম অ্যাডমিন"),
    kind: "platform",
    description: l("Platform administration view", "প্ল্যাটফর্ম প্রশাসন ভিউ"),
    mockPersonaId: "persona-platform-admin",
    platformRole: "platform_admin",
    journeyScope: "platform",
  },
  {
    id: "platform-ops-support",
    label: l("Operations and support", "অপারেশন ও সাপোর্ট"),
    kind: "platform",
    description: l("Customer support and operations view", "কাস্টমার সাপোর্ট ও অপারেশন ভিউ"),
    mockPersonaId: "persona-platform-support",
    platformRole: "customer_support",
    journeyScope: "platform",
  },
  {
    id: "platform-finance",
    label: l("Finance and settlements", "ফাইন্যান্স ও সেটেলমেন্ট"),
    kind: "platform",
    description: l("Finance and settlements view", "ফাইন্যান্স ও সেটেলমেন্ট ভিউ"),
    mockPersonaId: "persona-platform-finance",
    platformRole: "finance_settlements",
    journeyScope: "platform",
  },
];

export const prototypeJourneyShortcuts: PrototypeJourneyShortcut[] = [
  { id: "general-home", label: l("Home", "হোম"), href: "/", area: "general", requiresSignIn: false, status: "available" },
  { id: "general-prototype", label: l("Prototype foundation", "প্রোটোটাইপ ফাউন্ডেশন"), href: "/prototype", area: "general", requiresSignIn: false, status: "available" },
  { id: "general-login", label: l("Sign in screen", "সাইন ইন স্ক্রিন"), href: "/login", area: "general", requiresSignIn: false, status: "available" },
  { id: "customer-search", label: l("Search", "সার্চ"), href: "/search", area: "customer", requiresSignIn: false, status: "planned" },
  { id: "customer-cart", label: l("Cart", "কার্ট"), href: "/cart", area: "customer", requiresSignIn: false, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout", label: l("Checkout", "চেকআউট"), href: "/checkout", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout-empty", label: l("Checkout: empty selection", "চেকআউট: খালি নির্বাচন"), href: "/checkout?scenario=empty_selection", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout-no-address", label: l("Checkout: no saved address", "চেকআউট: সংরক্ষিত ঠিকানা নেই"), href: "/checkout?scenario=no_address", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout-unavailable", label: l("Checkout: unavailable item", "চেকআউট: পণ্য পাওয়া যাচ্ছে না"), href: "/checkout?scenario=unavailable_item", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout-payment-failure", label: l("Checkout: payment failure", "চেকআউট: পেমেন্ট ব্যর্থ"), href: "/checkout?scenario=payment_failure", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-checkout-placement-failure", label: l("Checkout: placement failure", "চেকআউট: অর্ডার ব্যর্থ"), href: "/checkout?scenario=placement_failure", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-order-confirmation", label: l("Order confirmation", "অর্ডার নিশ্চিতকরণ"), href: "/order/confirmation", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-wishlist", label: l("Wishlist", "উইশলিস্ট"), href: "/wishlist", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-account", label: l("Account profile", "অ্যাকাউন্ট প্রোফাইল"), href: "/account", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-addresses", label: l("Saved addresses", "সংরক্ষিত ঠিকানা"), href: "/account/addresses", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-orders", label: l("Order history", "অর্ডার ইতিহাস"), href: "/account/orders", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-order-detail", label: l("Order detail", "অর্ডারের বিবরণ"), href: "/account/orders/CU-1001", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-empty-orders", label: l("Orders: empty", "অর্ডার: খালি"), href: "/account/orders?scenario=empty_orders", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-no-addresses", label: l("Addresses: empty", "ঠিকানা: খালি"), href: "/account/addresses?scenario=no_addresses", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-account-invalid-form", label: l("Account: invalid form", "অ্যাকাউন্ট: অবৈধ ফর্ম"), href: "/account?scenario=invalid_form", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-account-loading", label: l("Account: loading", "অ্যাকাউন্ট: লোড হচ্ছে"), href: "/account?scenario=loading", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-account-error", label: l("Account: error", "অ্যাকাউন্ট: ত্রুটি"), href: "/account?scenario=error", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-order-not-found", label: l("Order: not found", "অর্ডার: পাওয়া যায়নি"), href: "/account/orders/CU-MISSING?scenario=order_not_found", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-unknown-scenario", label: l("Unknown scenario falls back", "অজানা সিনারিও ডিফল্টে ফিরে যায়"), href: "/account?scenario=not_a_scenario", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-track", label: l("Track order", "অর্ডার ট্র্যাক"), href: "/order/track?shipment=ship-1", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-track-empty", label: l("Tracking: no selection", "ট্র্যাকিং: কোনো চালান নেই"), href: "/order/track", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-track-not-found", label: l("Tracking: not found", "ট্র্যাকিং: পাওয়া যায়নি"), href: "/order/track?shipment=ship-missing&scenario=tracking_not_found", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-pending", label: l("Shipment: pending", "চালান: অপেক্ষমাণ"), href: "/order/track?shipment=demo-pending", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-packed", label: l("Shipment: packed", "চালান: প্যাক করা"), href: "/order/track?shipment=demo-packed", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-shipped", label: l("Shipment: shipped", "চালান: প্রেরিত"), href: "/order/track?shipment=demo-shipped", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-out-for-delivery", label: l("Shipment: out for delivery", "চালান: ডেলিভারিতে আছে"), href: "/order/track?shipment=demo-out-for-delivery", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-delivered", label: l("Shipment: delivered", "চালান: ডেলিভারি সম্পন্ন"), href: "/order/track?shipment=demo-delivered", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-cancelled", label: l("Shipment: cancelled", "চালান: বাতিল"), href: "/order/track?shipment=demo-cancelled", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-exception", label: l("Shipment: delivery exception", "চালান: ডেলিভারি সমস্যা"), href: "/order/track?shipment=demo-delivery-exception", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "customer-shipment-exception-scenario", label: l("Shipment: exception scenario", "চালান: সমস্যা সিনারিও"), href: "/order/track?shipment=ship-2&scenario=shipment_exception", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "available" },
  { id: "seller-entry", label: l("Seller entry", "বিক্রেতা প্রবেশ"), href: "/seller", area: "seller", requiresSignIn: true, suggestedPersonaId: "seller-owner", status: "planned" },
  { id: "seller-dashboard", label: l("Seller dashboard", "বিক্রেতা ড্যাশবোর্ড"), href: "/seller/dashboard", area: "seller", requiresSignIn: true, suggestedPersonaId: "seller-owner", status: "planned" },
  { id: "platform-admin", label: l("Admin overview", "অ্যাডমিন ওভারভিউ"), href: "/admin", area: "platform", requiresSignIn: true, suggestedPersonaId: "platform-admin", status: "planned" },
  { id: "platform-ops", label: l("Operations", "অপারেশন"), href: "/admin/operations", area: "platform", requiresSignIn: true, suggestedPersonaId: "platform-ops-support", status: "planned" },
  { id: "platform-finance", label: l("Finance and settlements", "ফাইন্যান্স ও সেটেলমেন্ট"), href: "/admin/finance", area: "platform", requiresSignIn: true, suggestedPersonaId: "platform-finance", status: "planned" },
];

export const defaultPrototypeSession: PrototypeSession = {
  activePersonaId: "guest",
  isPanelOpen: false,
  version: PROTOTYPE_SESSION_VERSION,
};

export function getPrototypePersonaById(id: string): PrototypePersonaOption | undefined {
  return prototypePersonaOptions.find((p) => p.id === id);
}
