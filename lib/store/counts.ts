"use client";

/**
 * Placeholder badge counts for the header.
 *
 * TODO(cart): replace the return values with Zustand selectors once the
 * cart/wishlist stores exist. Keeping the hooks now means the header badge
 * components never need to change when real data lands.
 */
export function useCartCount(): number {
  return 0;
}

export function useWishlistCount(): number {
  return 0;
}
