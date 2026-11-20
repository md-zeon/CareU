"use client";

/**
 * Creates one browser-scoped store per mounted tree and rehydrates it only
 * after mount. Pages render the same empty collections on the server and on
 * the first client render, then update once localStorage has been read.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createSharedPrototypeStore, type SharedPrototypeStoreApi } from "./store";
import type { SharedPrototypeStore } from "./types";

type SharedPrototypeStoreContextValue = {
  store: SharedPrototypeStoreApi;
  hydrated: boolean;
};

const SharedPrototypeStoreContext =
  createContext<SharedPrototypeStoreContextValue | null>(null);

export function SharedPrototypeStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState<SharedPrototypeStoreApi>(() => createSharedPrototypeStore());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void store.persist.rehydrate().finally(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [store]);

  return (
    <SharedPrototypeStoreContext.Provider value={{ store, hydrated }}>
      {children}
    </SharedPrototypeStoreContext.Provider>
  );
}

export function useSharedStoreContext() {
  const value = useContext(SharedPrototypeStoreContext);
  if (!value) {
    throw new Error("SharedPrototypeStoreProvider is missing");
  }
  return value;
}

export function useSharedStoreHydrated(): boolean {
  return useSharedStoreContext().hydrated;
}

export function useSharedStore<T>(selector: (state: SharedPrototypeStore) => T): T {
  return useStore(useSharedStoreContext().store, selector);
}
