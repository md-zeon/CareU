"use client";

import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { usePrototypeSession } from "@/lib/prototype/session";
import { useAccountStoreContext } from "./provider";
import type { AccountStore } from "./types";

export { useAccountStore, useAccountStoreHydrated } from "./provider";

/** Subscribe to an object selector without re-rendering on unrelated state changes. */
export function useAccountStoreShallow<T>(selector: (state: AccountStore) => T): T {
  const { store } = useAccountStoreContext();
  return useStore(store, useShallow(selector));
}

export function useAccountStoreActions() {
  return useAccountStoreShallow((state) => ({
    saveProfile: state.saveProfile,
    saveAddress: state.saveAddress,
    deleteAddress: state.deleteAddress,
    setDefaultAddress: state.setDefaultAddress,
    resetForPersona: state.resetForPersona,
  }));
}

/** The trusted UI-level customer id that every account read is filtered by. */
export function useAccountCustomerId(): string | null {
  const { activePersona } = usePrototypeSession();
  if (activePersona.kind !== "customer" || activePersona.journeyScope !== "customer") return null;
  return activePersona.mockPersonaId ?? null;
}
