"use client";

import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useSharedStoreContext } from "./provider";
import type { SharedPrototypeStore } from "./types";

export { useSharedStore, useSharedStoreHydrated } from "./provider";

/** Subscribe to an object selector without re-rendering on unrelated state changes. */
export function useSharedStoreShallow<T>(selector: (state: SharedPrototypeStore) => T): T {
  const { store } = useSharedStoreContext();
  return useStore(store, useShallow(selector));
}

export function useSharedStoreActions() {
  return useSharedStoreShallow((state) => ({
    addToCart: state.addToCart,
    setQuantity: state.setQuantity,
    removeFromCart: state.removeFromCart,
    toggleSelected: state.toggleSelected,
    selectAll: state.selectAll,
    clearSelection: state.clearSelection,
    saveForLater: state.saveForLater,
    removeSavedForLater: state.removeSavedForLater,
    moveSavedToCart: state.moveSavedToCart,
    moveSavedToWishlist: state.moveSavedToWishlist,
    moveCartToWishlist: state.moveCartToWishlist,
    addToWishlist: state.addToWishlist,
    removeFromWishlist: state.removeFromWishlist,
    moveWishlistToCart: state.moveWishlistToCart,
    proceedToCheckout: state.proceedToCheckout,
    resetAll: state.resetAll,
  }));
}
