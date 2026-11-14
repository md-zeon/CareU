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
  { id: "general-home", label: l("Home", "হোম"), href: "/", area: "general", requiresSignIn: false, status: "planned" },
  { id: "general-prototype", label: l("Prototype foundation", "প্রোটোটাইপ ফাউন্ডেশন"), href: "/prototype", area: "general", requiresSignIn: false, status: "available" },
  { id: "general-login", label: l("Sign in screen", "সাইন ইন স্ক্রিন"), href: "/login", area: "general", requiresSignIn: false, status: "available" },
  { id: "customer-search", label: l("Search", "সার্চ"), href: "/search", area: "customer", requiresSignIn: false, status: "planned" },
  { id: "customer-cart", label: l("Cart", "কার্ট"), href: "/cart", area: "customer", requiresSignIn: false, suggestedPersonaId: "customer", status: "planned" },
  { id: "customer-wishlist", label: l("Wishlist", "উইশলিস্ট"), href: "/wishlist", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "planned" },
  { id: "customer-account", label: l("Account", "অ্যাকাউন্ট"), href: "/account", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "planned" },
  { id: "customer-track", label: l("Track order", "অর্ডার ট্র্যাক"), href: "/order/track", area: "customer", requiresSignIn: true, suggestedPersonaId: "customer", status: "planned" },
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
