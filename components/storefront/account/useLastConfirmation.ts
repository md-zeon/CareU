"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  LAST_CONFIRMATION_KEY,
  parseLastConfirmationValue,
  type OrderConfirmation,
} from "@/lib/mock/checkout";

const LOADING = "__loading__";
const EMPTY = "__empty__";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string {
  return window.sessionStorage.getItem(LAST_CONFIRMATION_KEY) ?? EMPTY;
}

function getServerSnapshot(): string {
  return LOADING;
}

/** Mirrors the confirmation page read so history can show the newest mock order. */
export function useLastConfirmation(): OrderConfirmation | null | undefined {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    if (snapshot === LOADING) return undefined;
    if (snapshot === EMPTY) return null;
    return parseLastConfirmationValue(snapshot);
  }, [snapshot]);
}
