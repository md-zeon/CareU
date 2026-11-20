/**
 * PLACEHOLDER: checkout fixtures for the UI prototype, not a pricing policy.
 *
 * Delivery charges here are mock values for review only. Real delivery pricing
 * is still an open policy decision and must never be inferred from this table.
 */

import type { Locale } from "@/lib/i18n/routing";
import { mockAddresses } from "@/lib/mock/commerce";
import type { LocalizedText } from "@/lib/mock/types";
import { l } from "@/lib/mock/types";
import { bdtToPoisha, type Poisha } from "@/lib/money/poisha";
import type { CheckoutAddressView, CheckoutScenario, DeliveryOptionView, PaymentMethodView } from "./types";

const CUSTOMER_PERSONA_ID = "persona-customer";
const FALLBACK_DISTRICT_KEY = "other";

export const CHECKOUT_SCENARIOS: CheckoutScenario[] = [
  "default",
  "empty_selection",
  "no_address",
  "unavailable_item",
  "payment_failure",
  "placement_failure",
];

const DISTRICT_ALIASES: Record<string, string> = {
  dhaka: "dhaka",
  "ঢাকা": "dhaka",
  chattogram: "chattogram",
  chittagong: "chattogram",
  "চট্টগ্রাম": "chattogram",
  rajshahi: "rajshahi",
  "রাজশাহী": "rajshahi",
  sylhet: "sylhet",
  "সিলেট": "sylhet",
};

/** Mock rule table: option id then destination district, with a fallback rule. */
export const MOCK_DELIVERY_RULES: Record<string, Record<string, Poisha>> = {
  standard: {
    dhaka: bdtToPoisha(60),
    chattogram: bdtToPoisha(90),
    rajshahi: bdtToPoisha(100),
    sylhet: bdtToPoisha(110),
    [FALLBACK_DISTRICT_KEY]: bdtToPoisha(120),
  },
  express: {
    dhaka: bdtToPoisha(120),
    chattogram: bdtToPoisha(180),
    rajshahi: bdtToPoisha(190),
    sylhet: bdtToPoisha(200),
    [FALLBACK_DISTRICT_KEY]: bdtToPoisha(220),
  },
};

type DeliveryOptionFixture = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
};

const DELIVERY_OPTION_FIXTURES: DeliveryOptionFixture[] = [
  {
    id: "standard",
    label: l("Standard delivery", "স্ট্যান্ডার্ড ডেলিভারি"),
    description: l("Regular delivery across all districts", "সব জেলায় নিয়মিত ডেলিভারি"),
  },
  {
    id: "express",
    label: l("Express delivery", "এক্সপ্রেস ডেলিভারি"),
    description: l("Faster delivery where available", "যেখানে সম্ভব দ্রুত ডেলিভারি"),
  },
];

const PAYMENT_METHOD_FIXTURES: PaymentMethodView[] = [
  {
    id: "cod",
    label: l("Cash on delivery", "ক্যাশ অন ডেলিভারি"),
    description: l("Pay CareU when your order arrives", "অর্ডার পৌঁছালে কেয়ারইউকে দিয়ে দিন"),
    showsMockGateway: false,
  },
  {
    id: "online_mock",
    label: l("Online payment", "অনলাইন পেমেন্ট"),
    description: l("Prototype gateway preview, no card details needed", "প্রোটোটাইপ গেটওয়ে প্রিভিউ, কার্ডের তথ্য দরকার নেই"),
    showsMockGateway: true,
  },
];

export function textForLocale(value: LocalizedText, locale: Locale): string {
  return locale === "bn" ? value.bn : value.en;
}

function addressText(value: LocalizedText | string | undefined, locale: Locale): string {
  if (!value) return "";
  return typeof value === "string" ? value : textForLocale(value, locale);
}

export function districtKeyFor(value: LocalizedText | string): string {
  const english = addressText(value, "en");
  const bengali = addressText(value, "bn");
  return districtKeyFromText(english) ?? districtKeyFromText(bengali) ?? FALLBACK_DISTRICT_KEY;
}

export function districtKeyFromText(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return DISTRICT_ALIASES[normalized] ?? null;
}

export function getCheckoutScenario(value: string | null | undefined): CheckoutScenario {
  return CHECKOUT_SCENARIOS.find((scenario) => scenario === value) ?? "default";
}

/** Saved addresses come from the existing customer mock, filtered by scenario. */
export function getSavedAddresses(scenario: CheckoutScenario, locale: Locale): CheckoutAddressView[] {
  if (scenario === "no_address") return [];
  return mockAddresses
    .filter((address) => address.personaId === CUSTOMER_PERSONA_ID)
    .map((address) => ({
      id: address.id,
      label: textForLocale(address.label, locale),
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: [address.line1, address.line2].map((part) => addressText(part, locale)).filter(Boolean).join(", "),
      district: addressText(address.district, locale),
      districtKey: districtKeyFor(address.district),
      isDefault: address.isDefault,
    }));
}

export function getDeliveryOptions(destinationDistrictKey: string): DeliveryOptionView[] {
  return DELIVERY_OPTION_FIXTURES.map((option) => {
    const ruleForDistrict = MOCK_DELIVERY_RULES[option.id] ?? {};
    const chargePoisha = ruleForDistrict[destinationDistrictKey] ?? ruleForDistrict[FALLBACK_DISTRICT_KEY] ?? 0n;
    return {
      id: option.id,
      label: option.label,
      description: option.description,
      chargePoisha,
      usesFallback: ruleForDistrict[destinationDistrictKey] === undefined,
    };
  });
}

export function getPaymentMethods(): PaymentMethodView[] {
  return PAYMENT_METHOD_FIXTURES.map((method) => ({
    ...method,
    label: { ...method.label },
    description: { ...method.description },
  }));
}
