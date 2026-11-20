/** Session storage handoffs. Every read validates its parsed value before use. */

import {
  buyNowHandoffSchema,
  confirmationStorageSchema,
  deserializeConfirmation,
} from "./schemas";
import type { BuyNowHandoff, OrderConfirmation } from "./types";

export const BUY_NOW_HANDOFF_KEY = "careu.checkout.buyNow";
export const LAST_CONFIRMATION_KEY = "careu.checkout.lastConfirmation";

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    key,
    JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)),
  );
}

export function saveBuyNowDraft(handoff: BuyNowHandoff): void {
  writeJson(BUY_NOW_HANDOFF_KEY, handoff);
}

export function readBuyNowDraft(): BuyNowHandoff | null {
  const parsed = buyNowHandoffSchema.safeParse(readJson(BUY_NOW_HANDOFF_KEY));
  return parsed.success ? parsed.data : null;
}

export function clearBuyNowDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(BUY_NOW_HANDOFF_KEY);
}

export function saveLastConfirmation(confirmation: OrderConfirmation): void {
  writeJson(LAST_CONFIRMATION_KEY, { version: 1, confirmation });
}

export function parseLastConfirmationValue(raw: string | null): OrderConfirmation | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  const parsed = confirmationStorageSchema.safeParse(value);
  return parsed.success ? deserializeConfirmation(parsed.data) : null;
}

export function readLastConfirmation(): OrderConfirmation | null {
  if (typeof window === "undefined") return null;
  return parseLastConfirmationValue(window.sessionStorage.getItem(LAST_CONFIRMATION_KEY));
}

export function clearLastConfirmation(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LAST_CONFIRMATION_KEY);
}
