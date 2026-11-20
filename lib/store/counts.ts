"use client";

/** Header badge counts backed by the shared browser cart/wishlist store. */

import { useSharedStore } from "./shared/hooks";

export function useCartCount(): number {
  return useSharedStore((state) =>
    state.activeCartLines.reduce((total, line) => total + line.quantity, 0),
  );
}

export function useWishlistCount(): number {
  return useSharedStore((state) => state.wishlistLines.length);
}
