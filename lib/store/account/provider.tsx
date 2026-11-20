"use client";

/**
 * Creates one browser scoped account store per mounted tree. It reads storage
 * only after mount, then keeps the store aligned with the active customer
 * persona without letting a refresh wipe that persona's saved edits.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { usePrototypeSession } from "@/lib/prototype/session";
import { createAccountStore, type AccountStoreApi } from "./store";
import type { AccountStore } from "./types";

type AccountStoreContextValue = {
  store: AccountStoreApi;
  hydrated: boolean;
};

const AccountStoreContext = createContext<AccountStoreContextValue | null>(null);

function customerIdFor(persona: ReturnType<typeof usePrototypeSession>["activePersona"]): string | null {
  if (persona.kind !== "customer" || persona.journeyScope !== "customer") return null;
  return persona.mockPersonaId ?? null;
}

export function AccountStoreProvider({ children }: { children: ReactNode }) {
  const { activePersona, hydrated: sessionHydrated } = usePrototypeSession();
  const customerId = customerIdFor(activePersona);
  const [store] = useState<AccountStoreApi>(() => createAccountStore());
  const [hydrated, setHydrated] = useState(false);
  const previousCustomerId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void store.persist.rehydrate().finally(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [store]);

  useEffect(() => {
    if (!hydrated || !sessionHydrated) return;

    if (previousCustomerId.current === undefined) {
      previousCustomerId.current = customerId;
      if (store.getState().customerId !== customerId) {
        store.getState().resetForPersona(customerId);
      }
      return;
    }

    if (previousCustomerId.current !== customerId) {
      previousCustomerId.current = customerId;
      store.getState().resetForPersona(customerId);
    }
  }, [customerId, hydrated, sessionHydrated, store]);

  return (
    <AccountStoreContext.Provider value={{ store, hydrated }}>
      {children}
    </AccountStoreContext.Provider>
  );
}

export function useAccountStoreContext() {
  const value = useContext(AccountStoreContext);
  if (!value) {
    throw new Error("AccountStoreProvider is missing");
  }
  return value;
}

export function useAccountStoreHydrated(): boolean {
  return useAccountStoreContext().hydrated;
}

export function useAccountStore<T>(selector: (state: AccountStore) => T): T {
  return useStore(useAccountStoreContext().store, selector);
}
