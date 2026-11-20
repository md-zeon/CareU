/** Scenario parsing for the account journey. Unknown values fall back to default. */

import type { AccountScenario, AccountScenarioId, AccountVariant } from "./types";

export const ACCOUNT_SCENARIO_IDS: AccountScenarioId[] = [
  "default",
  "empty_orders",
  "no_addresses",
  "invalid_form",
  "order_not_found",
  "tracking_not_found",
  "loading",
  "error",
  "shipment_exception",
];

const variants: Record<AccountScenarioId, AccountScenario> = {
  default: {
    id: "default",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "default",
    shipmentVariant: "default",
  },
  empty_orders: {
    id: "empty_orders",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "empty",
    shipmentVariant: "default",
  },
  no_addresses: {
    id: "no_addresses",
    profileVariant: "default",
    addressVariant: "empty",
    orderVariant: "default",
    shipmentVariant: "default",
  },
  invalid_form: {
    id: "invalid_form",
    profileVariant: "invalid",
    addressVariant: "invalid",
    orderVariant: "default",
    shipmentVariant: "default",
  },
  order_not_found: {
    id: "order_not_found",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "not_found",
    shipmentVariant: "default",
  },
  tracking_not_found: {
    id: "tracking_not_found",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "default",
    shipmentVariant: "not_found",
  },
  loading: {
    id: "loading",
    profileVariant: "loading",
    addressVariant: "loading",
    orderVariant: "loading",
    shipmentVariant: "loading",
  },
  error: {
    id: "error",
    profileVariant: "error",
    addressVariant: "error",
    orderVariant: "error",
    shipmentVariant: "error",
  },
  shipment_exception: {
    id: "shipment_exception",
    profileVariant: "default",
    addressVariant: "default",
    orderVariant: "default",
    shipmentVariant: "exception",
  },
};

export function isAccountScenarioId(value: string): value is AccountScenarioId {
  return (ACCOUNT_SCENARIO_IDS as string[]).includes(value);
}

export function getAccountScenario(
  raw?: string | string[] | null,
): AccountScenario {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !isAccountScenarioId(value)) return variants.default;
  return variants[value];
}

export function variantOf(scenario: AccountScenario, area: "profile" | "address" | "order" | "shipment"): AccountVariant {
  switch (area) {
    case "profile":
      return scenario.profileVariant;
    case "address":
      return scenario.addressVariant;
    case "order":
      return scenario.orderVariant;
    case "shipment":
      return scenario.shipmentVariant;
  }
}
