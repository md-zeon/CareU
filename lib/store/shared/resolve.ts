/**
 * Resolve stored line ids into display data from the mock catalog.
 *
 * These helpers are pure and safe to call from a Client Component. They are
 * the single place where a stored productId, variantId, or shopId becomes a
 * title, image, unit price, availability, and onward link.
 */

import type { CardAvailability } from "@/lib/mock/browse/types";
import { mockListings, mockProducts, mockVariants } from "@/lib/mock/catalog";
import { mockShops, type MockShop } from "@/lib/mock/shops";
import type { LocalizedText } from "@/lib/mock/types";
import { findById, l } from "@/lib/mock/types";
import type { ResolvableLine } from "./types";

/** Fixed prototype ceiling for items whose mock availability has no numeric stock. */
export const DEFAULT_PROTOTYPE_MAX_QUANTITY = 10;
/** Prototype ceiling for variants labelled as low stock. */
export const LOW_STOCK_MAX_QUANTITY = 3;

const FALLBACK_IMAGE = "/products/product-1.svg";
const MISSING_TITLE = l("Product no longer available", "পণ্যটি আর পাওয়া যাচ্ছে না");

export function getAvailability(productId: string, variantId: string | null): CardAvailability {
  const variant = variantId ? findById(mockVariants, variantId) : null;
  if (variant && variant.productId !== productId) return "out_of_stock";
  return variant?.availability ?? "in_stock";
}

/** Quantity ceiling derived from the named mock availability state. Zero means unavailable. */
export function getMaxQuantity(productId: string, variantId: string | null): number {
  const product = findById(mockProducts, productId);
  if (!product || product.status !== "active") return 0;
  const availability = getAvailability(productId, variantId);
  if (availability === "out_of_stock") return 0;
  if (availability === "low_stock") return LOW_STOCK_MAX_QUANTITY;
  return DEFAULT_PROTOTYPE_MAX_QUANTITY;
}

/** Shop id used when a surface only knows the product and chosen variant. */
export function getShopIdForProduct(productId: string, variantId: string | null): string {
  const listing = mockListings.find(
    (item) => item.productId === productId && (variantId === null || item.variantId === variantId),
  );
  return listing?.shopId ?? mockListings.find((item) => item.productId === productId)?.shopId ?? "shop-caru";
}

export function clampQuantity(quantity: number, max: number): number {
  if (!Number.isFinite(quantity)) return 1;
  const whole = Math.max(1, Math.floor(quantity));
  return max > 0 ? Math.min(whole, max) : whole;
}

export type ResolvedLine = {
  lineId: string;
  productId: string;
  variantId: string | null;
  shopId: string;
  quantity: number;
  selected: boolean;
  title: LocalizedText;
  image: string;
  href: string;
  variantTitle: LocalizedText | null;
  sku: string | null;
  shopName: LocalizedText;
  shopType: MockShop["type"];
  shopHref: string;
  unitPriceBdt: number;
  lineTotalBdt: number;
  availability: CardAvailability;
  availabilityLabel: LocalizedText | null;
  isAvailable: boolean;
  maxQuantity: number;
};

function resolveShop(shopId: string): MockShop | null {
  return findById(mockShops, shopId);
}

export function resolveLine(line: ResolvableLine): ResolvedLine {
  const product = findById(mockProducts, line.productId);
  const variant = line.variantId ? findById(mockVariants, line.variantId) : null;
  const shop = resolveShop(line.shopId);
  const listing = mockListings.find(
    (item) =>
      item.productId === line.productId &&
      item.shopId === line.shopId &&
      (line.variantId === null || item.variantId === line.variantId),
  );

  const availability = getAvailability(line.productId, line.variantId);
  const maxQuantity = getMaxQuantity(line.productId, line.variantId);
  const isAvailable = Boolean(product) && maxQuantity > 0;
  const quantity = "quantity" in line ? clampQuantity(line.quantity, maxQuantity) : 1;
  const selected = "selected" in line ? line.selected && maxQuantity > 0 : false;
  const unitPriceBdt = variant?.priceBdt ?? listing?.priceBdt ?? 0;

  return {
    lineId: line.lineId,
    productId: line.productId,
    variantId: line.variantId,
    shopId: line.shopId,
    quantity,
    selected,
    title: product?.title ?? MISSING_TITLE,
    image: product?.images[0] ?? FALLBACK_IMAGE,
    href: product ? `/product/${product.slug}` : "/search",
    variantTitle: variant?.title ?? null,
    sku: variant?.sku ?? null,
    shopName: shop?.name ?? l("Shop unavailable", "দোকান পাওয়া যায়নি"),
    shopType: shop?.type ?? "third_party",
    shopHref: `/search?shop=${encodeURIComponent(line.shopId)}`,
    unitPriceBdt,
    lineTotalBdt: unitPriceBdt * quantity,
    availability,
    availabilityLabel: variant?.stockStateLabel ?? null,
    isAvailable,
    maxQuantity,
  };
}

export function resolveLines(lines: ResolvableLine[]): ResolvedLine[] {
  return lines.map(resolveLine);
}

export type CartShopGroup = {
  shopId: string;
  shopName: LocalizedText;
  shopType: MockShop["type"];
  shopHref: string;
  lines: ResolvedLine[];
};

export function groupCartLines(lines: ResolvedLine[]): CartShopGroup[] {
  const groups = new Map<string, CartShopGroup>();
  for (const line of lines) {
    const existing = groups.get(line.shopId);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    groups.set(line.shopId, {
      shopId: line.shopId,
      shopName: line.shopName,
      shopType: line.shopType,
      shopHref: line.shopHref,
      lines: [line],
    });
  }
  return [...groups.values()];
}

export function summarizeCart(lines: ResolvedLine[]): { count: number; subtotalBdt: bigint } {
  const chosen = lines.filter((line) => line.selected && line.isAvailable);
  return {
    count: chosen.length,
    subtotalBdt: chosen.reduce((sum, line) => sum + BigInt(line.lineTotalBdt), 0n),
  };
}
