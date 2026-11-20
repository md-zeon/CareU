/** Pure status, date, and result helpers shared by the account getters. */

import type { Locale } from "@/lib/i18n/routing";
import { l, type LocalizedText } from "../types";
import {
  TRACKING_STEP_ORDER,
  type AccountError,
  type AccountResult,
  type OrderStatusGroup,
  type ShipmentStatus,
  type TrackingStep,
} from "./types";

const STATUS_RANK: Record<ShipmentStatus, number> = {
  cancelled: 0,
  pending: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivery_exception: 5,
  delivered: 6,
};

/** The furthest active state wins, and all cancelled shipments cancel the order. */
export function deriveStatusGroup(shipments: readonly { status: ShipmentStatus }[]): OrderStatusGroup {
  if (shipments.length === 0) return "pending";
  if (shipments.every((shipment) => shipment.status === "cancelled")) return "cancelled";
  let winner: OrderStatusGroup = "pending";
  let best = -1;
  for (const shipment of shipments) {
    const rank = STATUS_RANK[shipment.status];
    if (rank > best) {
      best = rank;
      winner = shipment.status;
    }
  }
  return winner;
}

export function isTerminalStatus(status: ShipmentStatus): boolean {
  return status === "delivered" || status === "cancelled" || status === "delivery_exception";
}

export function trackingSteps(status: ShipmentStatus): TrackingStep[] {
  const currentIndex = TRACKING_STEP_ORDER.indexOf(status);
  const stopped = status === "cancelled" || status === "delivery_exception";
  const steps: TrackingStep[] = TRACKING_STEP_ORDER.map((step, index) => {
    if (stopped) {
      return { status: step, state: index <= 2 ? ("complete" as const) : ("upcoming" as const) };
    }
    if (currentIndex < 0) return { status: step, state: ("upcoming" as const) };
    if (index < currentIndex) return { status: step, state: ("complete" as const) };
    if (index === currentIndex) return { status: step, state: ("current" as const) };
    return { status: step, state: ("upcoming" as const) };
  });
  if (stopped) steps.push({ status, state: "stopped" });
  return steps;
}

export function formatAccountDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function statusLabelKey(status: ShipmentStatus): string {
  return `status_${status}`;
}

export function accountError(
  code: AccountError["code"],
  messageKey: string,
  retryable = false,
  fieldErrors?: AccountError["fieldErrors"],
): AccountError {
  return { code, messageKey, retryable, fieldErrors };
}

export function accountNotFound<T>(messageKey = "notFoundMessage"): AccountResult<T> {
  return { ok: false, error: accountError("not_found", messageKey) };
}

export function accountFailure<T>(error: AccountError): AccountResult<T> {
  return { ok: false, error };
}

export function accountSuccess<T>(data: T): AccountResult<T> {
  return { ok: true, data };
}

export const deliveryExceptionNote: LocalizedText = l(
  "Delivery could not be completed. CareU support would review this shipment.",
  "ডেলিভারি সম্পন্ন করা যায়নি। কেয়ারইউ সাপোর্ট এই চালানটি পর্যালোচনা করতো।",
);
