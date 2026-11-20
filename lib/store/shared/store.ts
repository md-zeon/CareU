/**
 * One vanilla Zustand store with browser persistence for the prototype cart
 * and wishlist. The provider creates it per browser session and rehydrates it
 * after mount, so no persisted value is read during server rendering.
 */

import type { StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { clampQuantity, getMaxQuantity } from "./resolve";
import type {
  ActiveCartLine,
  AddLineInput,
  LineIdentity,
  SavedForLaterLine,
  SharedPrototypeState,
  SharedPrototypeStore,
  WishlistLine,
} from "./types";

export const SHARED_PROTOTYPE_STORAGE_KEY = "careu.prototype.shared-cart-v1";
export const SHARED_PROTOTYPE_STORAGE_VERSION = 1;

type PersistedSharedState = Pick<
  SharedPrototypeState,
  "activeCartLines" | "savedForLaterLines" | "wishlistLines"
>;

const initialState: SharedPrototypeState = {
  activeCartLines: [],
  savedForLaterLines: [],
  wishlistLines: [],
  checkoutLineIds: [],
};

let lineSequence = 0;
function createLineId(prefix: string): string {
  lineSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${lineSequence.toString(36)}`;
}

function sameIdentity(line: LineIdentity, input: LineIdentity): boolean {
  return line.productId === input.productId && line.variantId === input.variantId;
}

function mergedQuantity(current: number, incoming: number, max: number): number {
  return clampQuantity(current + incoming, max);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readIdentity(value: Record<string, unknown>): LineIdentity | null {
  const { productId, shopId, variantId } = value;
  if (typeof productId !== "string" || typeof shopId !== "string") return null;
  return { productId, shopId, variantId: typeof variantId === "string" ? variantId : null };
}

function uniqueKey(identity: LineIdentity): string {
  return `${identity.productId}::${identity.variantId ?? ""}`;
}

function normalizeActive(raw: unknown): ActiveCartLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: ActiveCartLine[] = [];
  for (const item of raw) {
    const value = asRecord(item);
    if (!value || typeof value.lineId !== "string") continue;
    const identity = readIdentity(value);
    if (!identity) continue;
    const key = uniqueKey(identity);
    if (seen.has(key)) continue;
    seen.add(key);
    const max = getMaxQuantity(identity.productId, identity.variantId);
    result.push({
      ...identity,
      lineId: value.lineId,
      quantity: clampQuantity(Number(value.quantity), max),
      selected: value.selected === true && max > 0,
      addedAt: typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString(),
    });
  }
  return result;
}

function normalizeSaved(raw: unknown): SavedForLaterLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: SavedForLaterLine[] = [];
  for (const item of raw) {
    const value = asRecord(item);
    if (!value || typeof value.lineId !== "string") continue;
    const identity = readIdentity(value);
    if (!identity) continue;
    const key = uniqueKey(identity);
    if (seen.has(key)) continue;
    seen.add(key);
    const max = getMaxQuantity(identity.productId, identity.variantId);
    result.push({
      ...identity,
      lineId: value.lineId,
      quantity: clampQuantity(Number(value.quantity), max),
      savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
    });
  }
  return result;
}

function normalizeWishlist(raw: unknown): WishlistLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: WishlistLine[] = [];
  for (const item of raw) {
    const value = asRecord(item);
    if (!value || typeof value.lineId !== "string") continue;
    const identity = readIdentity(value);
    if (!identity) continue;
    const key = uniqueKey(identity);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      ...identity,
      lineId: value.lineId,
      addedAt: typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString(),
    });
  }
  return result;
}

export type SharedPrototypeStoreApi = StoreApi<SharedPrototypeStore> & {
  persist: { rehydrate: () => Promise<void> };
};

export function createSharedPrototypeStore() {
  return createStore<SharedPrototypeStore>()(
    persist<SharedPrototypeStore, [], [], PersistedSharedState>(
      (set) => ({
        ...initialState,

        addToCart: (input: AddLineInput) =>
          set((state) => {
            const identity: LineIdentity = {
              productId: input.productId,
              variantId: input.variantId ?? null,
              shopId: input.shopId,
            };
            const max = getMaxQuantity(identity.productId, identity.variantId);
            const quantity = clampQuantity(Number(input.quantity ?? 1), max);
            const existing = state.activeCartLines.find((line) => sameIdentity(line, identity));
            if (existing) {
              return {
                activeCartLines: state.activeCartLines.map((line) =>
                  line.lineId === existing.lineId
                    ? {
                        ...line,
                        quantity: mergedQuantity(line.quantity, quantity, max),
                        selected: max > 0,
                      }
                    : line,
                ),
              };
            }
            return {
              activeCartLines: [
                ...state.activeCartLines,
                {
                  ...identity,
                  lineId: createLineId("cart"),
                  quantity,
                  selected: max > 0,
                  addedAt: new Date().toISOString(),
                },
              ],
            };
          }),

        setQuantity: (lineId, quantity) =>
          set((state) => ({
            activeCartLines: state.activeCartLines.map((line) => {
              if (line.lineId !== lineId) return line;
              const max = getMaxQuantity(line.productId, line.variantId);
              if (max <= 0) return line;
              return { ...line, quantity: clampQuantity(Number(quantity), max) };
            }),
          })),

        removeFromCart: (lineId) =>
          set((state) => ({
            activeCartLines: state.activeCartLines.filter((line) => line.lineId !== lineId),
            checkoutLineIds: state.checkoutLineIds.filter((id) => id !== lineId),
          })),

        toggleSelected: (lineId) =>
          set((state) => ({
            activeCartLines: state.activeCartLines.map((line) => {
              if (line.lineId !== lineId || getMaxQuantity(line.productId, line.variantId) <= 0) return line;
              return { ...line, selected: !line.selected };
            }),
          })),

        selectAll: (shopId) =>
          set((state) => ({
            activeCartLines: state.activeCartLines.map((line) =>
              shopId && line.shopId !== shopId
                ? line
                : { ...line, selected: getMaxQuantity(line.productId, line.variantId) > 0 },
            ),
          })),

        clearSelection: (shopId) =>
          set((state) => ({
            activeCartLines: state.activeCartLines.map((line) =>
              shopId && line.shopId !== shopId ? line : { ...line, selected: false },
            ),
          })),

        saveForLater: (lineId) =>
          set((state) => {
            const line = state.activeCartLines.find((item) => item.lineId === lineId);
            if (!line) return state;
            const max = getMaxQuantity(line.productId, line.variantId);
            const existing = state.savedForLaterLines.find((item) => sameIdentity(item, line));
            const savedForLaterLines = existing
              ? state.savedForLaterLines.map((item) =>
                  item.lineId === existing.lineId
                    ? { ...item, quantity: mergedQuantity(item.quantity, line.quantity, max) }
                    : item,
                )
              : [
                  ...state.savedForLaterLines,
                  {
                    productId: line.productId,
                    variantId: line.variantId,
                    shopId: line.shopId,
                    lineId: createLineId("saved"),
                    quantity: clampQuantity(line.quantity, max),
                    savedAt: new Date().toISOString(),
                  },
                ];
            return {
              activeCartLines: state.activeCartLines.filter((item) => item.lineId !== lineId),
              checkoutLineIds: state.checkoutLineIds.filter((id) => id !== lineId),
              savedForLaterLines,
            };
          }),

        removeSavedForLater: (lineId) =>
          set((state) => ({
            savedForLaterLines: state.savedForLaterLines.filter((item) => item.lineId !== lineId),
          })),

        moveSavedToCart: (lineId) =>
          set((state) => {
            const line = state.savedForLaterLines.find((item) => item.lineId === lineId);
            if (!line) return state;
            const max = getMaxQuantity(line.productId, line.variantId);
            const existing = state.activeCartLines.find((item) => sameIdentity(item, line));
            const activeCartLines = existing
              ? state.activeCartLines.map((item) =>
                  item.lineId === existing.lineId
                    ? {
                        ...item,
                        quantity: mergedQuantity(item.quantity, line.quantity, max),
                        selected: item.selected || max > 0,
                      }
                    : item,
                )
              : [
                  ...state.activeCartLines,
                  {
                    productId: line.productId,
                    variantId: line.variantId,
                    shopId: line.shopId,
                    lineId: createLineId("cart"),
                    quantity: clampQuantity(line.quantity, max),
                    selected: max > 0,
                    addedAt: new Date().toISOString(),
                  },
                ];
            return {
              savedForLaterLines: state.savedForLaterLines.filter((item) => item.lineId !== lineId),
              activeCartLines,
            };
          }),

        moveSavedToWishlist: (lineId) =>
          set((state) => {
            const line = state.savedForLaterLines.find((item) => item.lineId === lineId);
            if (!line) return state;
            const exists = state.wishlistLines.some((item) => sameIdentity(item, line));
            return {
              savedForLaterLines: state.savedForLaterLines.filter((item) => item.lineId !== lineId),
              wishlistLines: exists
                ? state.wishlistLines
                : [
                    ...state.wishlistLines,
                    {
                      productId: line.productId,
                      variantId: line.variantId,
                      shopId: line.shopId,
                      lineId: createLineId("wish"),
                      addedAt: new Date().toISOString(),
                    },
                  ],
            };
          }),

        moveCartToWishlist: (lineId) =>
          set((state) => {
            const line = state.activeCartLines.find((item) => item.lineId === lineId);
            if (!line) return state;
            const exists = state.wishlistLines.some((item) => sameIdentity(item, line));
            return {
              activeCartLines: state.activeCartLines.filter((item) => item.lineId !== lineId),
              checkoutLineIds: state.checkoutLineIds.filter((id) => id !== lineId),
              wishlistLines: exists
                ? state.wishlistLines
                : [
                    ...state.wishlistLines,
                    {
                      productId: line.productId,
                      variantId: line.variantId,
                      shopId: line.shopId,
                      lineId: createLineId("wish"),
                      addedAt: new Date().toISOString(),
                    },
                  ],
            };
          }),

        addToWishlist: (input) =>
          set((state) => {
            const exists = state.wishlistLines.some((item) => sameIdentity(item, input));
            if (exists) return state;
            return {
              wishlistLines: [
                ...state.wishlistLines,
                {
                  productId: input.productId,
                  variantId: input.variantId ?? null,
                  shopId: input.shopId,
                  lineId: createLineId("wish"),
                  addedAt: new Date().toISOString(),
                },
              ],
            };
          }),

        removeFromWishlist: (lineId) =>
          set((state) => ({
            wishlistLines: state.wishlistLines.filter((item) => item.lineId !== lineId),
          })),

        moveWishlistToCart: (lineId) =>
          set((state) => {
            const line = state.wishlistLines.find((item) => item.lineId === lineId);
            if (!line) return state;
            const max = getMaxQuantity(line.productId, line.variantId);
            if (max <= 0) return state;
            const existing = state.activeCartLines.find((item) => sameIdentity(item, line));
            const activeCartLines = existing
              ? state.activeCartLines.map((item) =>
                  item.lineId === existing.lineId
                    ? { ...item, quantity: mergedQuantity(item.quantity, 1, max), selected: true }
                    : item,
                )
              : [
                  ...state.activeCartLines,
                  {
                    productId: line.productId,
                    variantId: line.variantId,
                    shopId: line.shopId,
                    lineId: createLineId("cart"),
                    quantity: 1,
                    selected: true,
                    addedAt: new Date().toISOString(),
                  },
                ];
            return {
              wishlistLines: state.wishlistLines.filter((item) => item.lineId !== lineId),
              activeCartLines,
            };
          }),

        proceedToCheckout: (lineIds) =>
          set((state) => {
            const allowed = new Set(lineIds);
            return {
              checkoutLineIds: state.activeCartLines
                .filter(
                  (line) =>
                    allowed.has(line.lineId) &&
                    line.selected &&
                    getMaxQuantity(line.productId, line.variantId) > 0,
                )
                .map((line) => line.lineId),
            };
          }),

        resetAll: () => set({ ...initialState }),
      }),
      {
        name: SHARED_PROTOTYPE_STORAGE_KEY,
        version: SHARED_PROTOTYPE_STORAGE_VERSION,
        skipHydration: true,
        partialize: (state): PersistedSharedState => ({
          activeCartLines: state.activeCartLines,
          savedForLaterLines: state.savedForLaterLines,
          wishlistLines: state.wishlistLines,
        }),
        merge: (persisted, current) => {
          const value = asRecord(persisted) ?? {};
          return {
            ...current,
            activeCartLines: normalizeActive(value.activeCartLines),
            savedForLaterLines: normalizeSaved(value.savedForLaterLines),
            wishlistLines: normalizeWishlist(value.wishlistLines),
            checkoutLineIds: [],
          };
        },
      },
    ),
  );
}
