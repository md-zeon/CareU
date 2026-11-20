/** Validation at the browser boundary: inline address input and session storage. */

import { z } from "zod";
import type { InlineAddressDraft, OrderConfirmation } from "./types";

/** Bangladesh phone format shared with the Better Auth validator. */
export const CHECKOUT_PHONE_PATTERN = /^(\+880|0)1[3-9]\d{8}$/;

export type AddressValidationMessages = {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  addressRequired: string;
  districtRequired: string;
};

export function createInlineAddressSchema(messages: AddressValidationMessages) {
  return z
    .object({
      recipientName: z.string().trim().min(2, messages.nameRequired),
      phone: z
        .string()
        .trim()
        .min(1, messages.phoneRequired)
        .regex(CHECKOUT_PHONE_PATTERN, messages.phoneInvalid),
      addressLine: z.string().trim().min(5, messages.addressRequired),
      district: z.string().trim().min(2, messages.districtRequired),
    })
    .strict();
}

export type InlineAddressSchema = ReturnType<typeof createInlineAddressSchema>;
export type InlineAddressFieldErrors = Partial<Record<keyof InlineAddressDraft, string[]>>;

export function validateAddressDraft(
  values: InlineAddressDraft,
  schema: InlineAddressSchema,
): { ok: true; value: InlineAddressDraft } | { ok: false; fieldErrors: InlineAddressFieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, fieldErrors: z.flattenError(result.error).fieldErrors as InlineAddressFieldErrors };
}

const poishaString = z.string().regex(/^-?\d+$/);
const localizedText = z.object({ en: z.string(), bn: z.string() });
const availability = z.enum(["in_stock", "low_stock", "out_of_stock"]);
const shopType = z.enum(["careu", "marketplace"]);

const itemSnapshot = z.object({
  lineId: z.string().nullable(),
  productId: z.string(),
  variantId: z.string().nullable(),
  shopId: z.string(),
  title: localizedText,
  variantTitle: localizedText.nullable(),
  image: z.string(),
  sku: z.string().nullable(),
  unitPricePoisha: poishaString,
  quantity: z.number().int().positive(),
  lineTotalPoisha: poishaString,
  availability,
  shopName: localizedText,
  shopType,
  href: z.string(),
});

const addressSnapshot = z.union([
  z.object({ kind: z.literal("saved"), address: z.object({
    id: z.string(), label: z.string(), recipientName: z.string(), phone: z.string(),
    addressLine: z.string(), district: z.string(), districtKey: z.string(), isDefault: z.boolean().optional(),
  }) }),
  z.object({ kind: z.literal("inline"), address: z.object({
    recipientName: z.string(), phone: z.string(), addressLine: z.string(), district: z.string(),
  }) }),
]);

const deliverySnapshot = z.object({
  id: z.string(),
  label: localizedText,
  description: localizedText,
  chargePoisha: poishaString,
  usesFallback: z.boolean(),
});

const paymentSnapshot = z.object({
  id: z.enum(["cod", "online_mock"]),
  label: localizedText,
  description: localizedText,
  showsMockGateway: z.boolean(),
});

const shopSummary = z.object({
  shopId: z.string(),
  shopName: localizedText,
  shopType,
  items: z.array(itemSnapshot),
  subtotalPoisha: poishaString,
});

const totals = z.object({
  subtotalPoisha: poishaString,
  deliveryPoisha: poishaString,
  totalPoisha: poishaString,
  itemCount: z.number().int().nonnegative(),
  perShopSummary: z.array(shopSummary),
});

export const confirmationStorageSchema = z.object({
  version: z.literal(1),
  confirmation: z.object({
    orderNumber: z.string(),
    placedAtLabel: z.string(),
    items: z.array(itemSnapshot),
    addressSnapshot,
    deliverySnapshot,
    paymentSnapshot,
    totals,
    perShopSummary: z.array(shopSummary),
  }),
});

export type StoredConfirmation = z.infer<typeof confirmationStorageSchema>;

export const buyNowHandoffSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  shopId: z.string().min(1),
  quantity: z.number().int().positive(),
});

/** Convert validated string money back into bigint after a session storage read. */
export function deserializeConfirmation(stored: StoredConfirmation): OrderConfirmation {
  const restoreItem = (item: StoredConfirmation["confirmation"]["items"][number]) => ({
    ...item,
    unitPricePoisha: BigInt(item.unitPricePoisha),
    lineTotalPoisha: BigInt(item.lineTotalPoisha),
  });
  const restoreShop = (shop: StoredConfirmation["confirmation"]["perShopSummary"][number]) => ({
    ...shop,
    items: shop.items.map(restoreItem),
    subtotalPoisha: BigInt(shop.subtotalPoisha),
  });
  const { confirmation } = stored;

  return {
    orderNumber: confirmation.orderNumber,
    placedAtLabel: confirmation.placedAtLabel,
    items: confirmation.items.map(restoreItem),
    addressSnapshot: confirmation.addressSnapshot,
    deliverySnapshot: {
      ...confirmation.deliverySnapshot,
      chargePoisha: BigInt(confirmation.deliverySnapshot.chargePoisha),
    },
    paymentSnapshot: confirmation.paymentSnapshot,
    totals: {
      subtotalPoisha: BigInt(confirmation.totals.subtotalPoisha),
      deliveryPoisha: BigInt(confirmation.totals.deliveryPoisha),
      totalPoisha: BigInt(confirmation.totals.totalPoisha),
      itemCount: confirmation.totals.itemCount,
      perShopSummary: confirmation.totals.perShopSummary.map(restoreShop),
    },
    perShopSummary: confirmation.perShopSummary.map(restoreShop),
  };
}
