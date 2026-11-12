import {
  ALL_PLATFORM_PERMISSIONS,
  ALL_SHOP_PERMISSIONS,
  PLATFORM_PERMISSIONS,
  SHOP_PERMISSIONS,
  type PlatformPermission,
  type ShopPermission,
} from "./permissions.ts";

export type PlatformRoleKey =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "CATALOGUE_PRICING"
  | "INVENTORY_PROCUREMENT"
  | "DELIVERY_OPERATIONS"
  | "CUSTOMER_SUPPORT"
  | "FINANCE_SETTLEMENTS"
  | "TRUST_MODERATION";

export type ShopRoleKey = "MANAGER" | "CATALOGUE" | "FULFILMENT" | "SUPPORT";

export const SUPER_ADMIN_EXCLUSIVE: ReadonlySet<PlatformPermission> = new Set([
  PLATFORM_PERMISSIONS.ROLE_MANAGE,
  PLATFORM_PERMISSIONS.THEME_MANAGE,
]);

// Owner bundle holds all sixteen shop permissions (spec 0002).
export const OWNER_BUNDLE: ReadonlySet<ShopPermission> = new Set(
  ALL_SHOP_PERMISSIONS,
);

export const SHOP_ROLE_BUNDLES: Readonly<
  Record<ShopRoleKey, ReadonlySet<ShopPermission>>
> = {
  MANAGER: new Set([
    SHOP_PERMISSIONS.PROFILE_READ,
    SHOP_PERMISSIONS.PROFILE_WRITE,
    SHOP_PERMISSIONS.LISTING_READ,
    SHOP_PERMISSIONS.LISTING_WRITE,
    SHOP_PERMISSIONS.LISTING_PUBLISH,
    SHOP_PERMISSIONS.LISTING_REMOVE,
    SHOP_PERMISSIONS.INVENTORY_READ,
    SHOP_PERMISSIONS.INVENTORY_ADJUST,
    SHOP_PERMISSIONS.INVENTORY_RESTOCK,
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.FULFILLMENT_MANAGE,
    SHOP_PERMISSIONS.RETURN_MANAGE,
    SHOP_PERMISSIONS.SUPPORT_MANAGE,
    SHOP_PERMISSIONS.MONEY_READ,
  ]),
  CATALOGUE: new Set([
    SHOP_PERMISSIONS.PROFILE_READ,
    SHOP_PERMISSIONS.LISTING_READ,
    SHOP_PERMISSIONS.LISTING_WRITE,
    SHOP_PERMISSIONS.LISTING_PUBLISH,
    SHOP_PERMISSIONS.LISTING_REMOVE,
    SHOP_PERMISSIONS.INVENTORY_READ,
  ]),
  FULFILMENT: new Set([
    SHOP_PERMISSIONS.PROFILE_READ,
    SHOP_PERMISSIONS.INVENTORY_READ,
    SHOP_PERMISSIONS.INVENTORY_ADJUST,
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.FULFILLMENT_MANAGE,
    SHOP_PERMISSIONS.RETURN_MANAGE,
  ]),
  SUPPORT: new Set([
    SHOP_PERMISSIONS.PROFILE_READ,
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.RETURN_MANAGE,
    SHOP_PERMISSIONS.SUPPORT_MANAGE,
  ]),
};

export const PLATFORM_ROLE_BUNDLES: Readonly<
  Record<PlatformRoleKey, ReadonlySet<PlatformPermission>>
> = {
  SUPER_ADMIN: new Set(ALL_PLATFORM_PERMISSIONS),
  PLATFORM_ADMIN: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.SHOP_MODERATE,
    PLATFORM_PERMISSIONS.SELLER_REVIEW,
    PLATFORM_PERMISSIONS.SELLER_DOCUMENT_READ,
    PLATFORM_PERMISSIONS.SELLER_TRUST_MANAGE,
    PLATFORM_PERMISSIONS.LISTING_MODERATE,
    PLATFORM_PERMISSIONS.REVIEW_MODERATE,
    PLATFORM_PERMISSIONS.CATEGORY_MANAGE,
    PLATFORM_PERMISSIONS.CATALOGUE_MANAGE,
    PLATFORM_PERMISSIONS.INVENTORY_MANAGE,
    PLATFORM_PERMISSIONS.PROCUREMENT_MANAGE,
    PLATFORM_PERMISSIONS.DELIVERY_MANAGE,
    PLATFORM_PERMISSIONS.ORDER_READ,
    PLATFORM_PERMISSIONS.ORDER_MANAGE,
    PLATFORM_PERMISSIONS.CUSTOMER_READ,
    PLATFORM_PERMISSIONS.SUPPORT_MANAGE,
    PLATFORM_PERMISSIONS.DISPUTE_RESOLVE,
    PLATFORM_PERMISSIONS.AUDIT_READ,
    PLATFORM_PERMISSIONS.CMS_MANAGE,
  ]),
  CATALOGUE_PRICING: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.LISTING_MODERATE,
    PLATFORM_PERMISSIONS.CATEGORY_MANAGE,
    PLATFORM_PERMISSIONS.CATALOGUE_MANAGE,
  ]),
  INVENTORY_PROCUREMENT: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.INVENTORY_MANAGE,
    PLATFORM_PERMISSIONS.PROCUREMENT_MANAGE,
  ]),
  DELIVERY_OPERATIONS: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.DELIVERY_MANAGE,
    PLATFORM_PERMISSIONS.ORDER_READ,
  ]),
  CUSTOMER_SUPPORT: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.ORDER_READ,
    PLATFORM_PERMISSIONS.CUSTOMER_READ,
    PLATFORM_PERMISSIONS.SUPPORT_MANAGE,
    PLATFORM_PERMISSIONS.DISPUTE_RESOLVE,
    PLATFORM_PERMISSIONS.REFUND_REQUEST,
  ]),
  FINANCE_SETTLEMENTS: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.ORDER_READ,
    PLATFORM_PERMISSIONS.REFUND_APPROVE,
    PLATFORM_PERMISSIONS.PAYMENT_RECONCILE,
    PLATFORM_PERMISSIONS.COMMISSION_MANAGE,
    PLATFORM_PERMISSIONS.LEDGER_READ,
    PLATFORM_PERMISSIONS.PAYOUT_MANAGE,
    PLATFORM_PERMISSIONS.PAYOUT_APPROVE,
    PLATFORM_PERMISSIONS.COD_RECONCILE,
    PLATFORM_PERMISSIONS.AUDIT_READ,
  ]),
  TRUST_MODERATION: new Set([
    PLATFORM_PERMISSIONS.SHOP_READ,
    PLATFORM_PERMISSIONS.SHOP_MODERATE,
    PLATFORM_PERMISSIONS.SELLER_REVIEW,
    PLATFORM_PERMISSIONS.SELLER_DOCUMENT_READ,
    PLATFORM_PERMISSIONS.SELLER_TRUST_MANAGE,
    PLATFORM_PERMISSIONS.LISTING_MODERATE,
    PLATFORM_PERMISSIONS.REVIEW_MODERATE,
  ]),
};

// CareU first party shop mapping: platform roles acting on isFirstParty shop via shop permissions (spec 0002).
export const CAREU_SHOP_PERMISSION_MAP: Readonly<
  Record<PlatformRoleKey, ReadonlySet<ShopPermission>>
> = {
  SUPER_ADMIN: new Set(ALL_SHOP_PERMISSIONS),
  PLATFORM_ADMIN: new Set([
    SHOP_PERMISSIONS.PROFILE_READ,
    SHOP_PERMISSIONS.LISTING_READ,
    SHOP_PERMISSIONS.LISTING_WRITE,
    SHOP_PERMISSIONS.LISTING_PUBLISH,
    SHOP_PERMISSIONS.LISTING_REMOVE,
    SHOP_PERMISSIONS.INVENTORY_READ,
    SHOP_PERMISSIONS.INVENTORY_ADJUST,
    SHOP_PERMISSIONS.INVENTORY_RESTOCK,
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.FULFILLMENT_MANAGE,
    SHOP_PERMISSIONS.RETURN_MANAGE,
    SHOP_PERMISSIONS.SUPPORT_MANAGE,
  ]),
  CATALOGUE_PRICING: new Set([
    SHOP_PERMISSIONS.LISTING_READ,
    SHOP_PERMISSIONS.LISTING_WRITE,
    SHOP_PERMISSIONS.LISTING_PUBLISH,
    SHOP_PERMISSIONS.LISTING_REMOVE,
    SHOP_PERMISSIONS.INVENTORY_READ,
  ]),
  INVENTORY_PROCUREMENT: new Set([
    SHOP_PERMISSIONS.INVENTORY_READ,
    SHOP_PERMISSIONS.INVENTORY_ADJUST,
    SHOP_PERMISSIONS.INVENTORY_RESTOCK,
    SHOP_PERMISSIONS.LISTING_READ,
  ]),
  DELIVERY_OPERATIONS: new Set([
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.FULFILLMENT_MANAGE,
    SHOP_PERMISSIONS.RETURN_MANAGE,
  ]),
  CUSTOMER_SUPPORT: new Set([
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.RETURN_MANAGE,
    SHOP_PERMISSIONS.SUPPORT_MANAGE,
  ]),
  FINANCE_SETTLEMENTS: new Set([
    SHOP_PERMISSIONS.ORDER_READ,
    SHOP_PERMISSIONS.MONEY_READ,
  ]),
  TRUST_MODERATION: new Set([SHOP_PERMISSIONS.LISTING_READ]),
};

export const CONFLICTING_PLATFORM_ROLE_PAIRS: ReadonlyArray<
  readonly [PlatformRoleKey, PlatformRoleKey]
> = [["CUSTOMER_SUPPORT", "FINANCE_SETTLEMENTS"]];

export function isConflictingPlatformRolePair(
  a: PlatformRoleKey,
  b: PlatformRoleKey,
): boolean {
  return CONFLICTING_PLATFORM_ROLE_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

// Resource access matrix (contract) — which models/fields each permission reaches (spec 0002).
export const RESOURCE_ACCESS_MATRIX: ReadonlyArray<{
  permission: PlatformPermission | ShopPermission;
  reaches: readonly string[];
  notes: string;
}> = [
  { permission: PLATFORM_PERMISSIONS.SHOP_READ, reaches: ["Shop.id", "Shop.name", "Shop.slug", "Shop.status", "Shop.isFirstParty", "Shop.isTrusted"], notes: "No owner contact and no payout destination" },
  { permission: PLATFORM_PERMISSIONS.CUSTOMER_READ, reaches: ["User.name", "User.email", "User.phoneNumber", "SavedAddress", "Order.contactSnapshots"], notes: "Contact data only, no financial records" },
  { permission: PLATFORM_PERMISSIONS.ORDER_READ, reaches: ["Order", "OrderItem", "Shipment", "statusHistory"], notes: "No payment amounts, ledger, or commission" },
  { permission: SHOP_PERMISSIONS.ORDER_READ, reaches: ["Shipment (own shop)", "OrderItem (own shop)", "recipient/phone snapshots"], notes: "Needed to deliver, scoped to the shop" },
  { permission: PLATFORM_PERMISSIONS.PAYMENT_RECONCILE, reaches: ["Payment", "PaymentEvent", "Payment.providerReference"], notes: "No bank destination" },
  { permission: PLATFORM_PERMISSIONS.LEDGER_READ, reaches: ["FinancialLedgerEntry"], notes: "Read only" },
  { permission: PLATFORM_PERMISSIONS.PAYOUT_MANAGE, reaches: ["PayoutBatch", "PayoutItem", "PayoutBatch.destinationRef", "PayoutItem.destinationRef"], notes: "Bank and wallet destination data lives here" },
  { permission: PLATFORM_PERMISSIONS.PAYOUT_APPROVE, reaches: ["PayoutBatch.amounts", "PayoutBatch.status", "PayoutItem.amounts", "PayoutItem.status"], notes: "Cannot change destinationRef" },
  { permission: PLATFORM_PERMISSIONS.SELLER_DOCUMENT_READ, reaches: ["SellerVerificationDocument.storageKey", "SellerVerificationDocument.metadata"], notes: "Private media, access logged" },
  { permission: SHOP_PERMISSIONS.MONEY_READ, reaches: ["FinancialLedgerEntry (own shop)", "PayoutItem summaries (own shop)"], notes: "No destinationRef" },
  { permission: PLATFORM_PERMISSIONS.COMMISSION_MANAGE, reaches: ["CommissionRule"], notes: "Rates remain pending policy" },
  { permission: PLATFORM_PERMISSIONS.COD_RECONCILE, reaches: ["CODReconciliationRecord", "courier/evidence references"], notes: "No automatic shortage classification" },
  { permission: PLATFORM_PERMISSIONS.AUDIT_READ, reaches: ["AuditLog"], notes: "Secrets and personal data stay masked" },
  { permission: SHOP_PERMISSIONS.INVENTORY_READ, reaches: ["InventoryBalance (own shop)", "StockMovement (own shop)"], notes: "Scoped by the shop's stock locations" },
  { permission: SHOP_PERMISSIONS.INVENTORY_ADJUST, reaches: ["InventoryBalance (own shop)", "StockMovement (own shop)"], notes: "Scoped by the shop's stock locations" },
  { permission: SHOP_PERMISSIONS.INVENTORY_RESTOCK, reaches: ["InventoryBalance (own shop)", "StockMovement (own shop)"], notes: "Scoped by the shop's stock locations" },
  { permission: SHOP_PERMISSIONS.LISTING_READ, reaches: ["Listing (own shop)", "ListingVariant", "ListingMedia"], notes: "Scoped by shopId" },
  { permission: SHOP_PERMISSIONS.LISTING_WRITE, reaches: ["Listing (own shop)", "ListingVariant", "ListingMedia"], notes: "Scoped by shopId" },
  { permission: SHOP_PERMISSIONS.LISTING_PUBLISH, reaches: ["Listing (own shop)", "ListingVariant", "ListingMedia"], notes: "Scoped by shopId" },
  { permission: SHOP_PERMISSIONS.LISTING_REMOVE, reaches: ["Listing (own shop)", "ListingVariant", "ListingMedia"], notes: "Scoped by shopId" },
  { permission: PLATFORM_PERMISSIONS.CATEGORY_MANAGE, reaches: ["Category", "CategoryAttribute", "Product", "ProductVariant"], notes: "Shared catalogue definitions" },
  { permission: PLATFORM_PERMISSIONS.CATALOGUE_MANAGE, reaches: ["Category", "CategoryAttribute", "Product", "ProductVariant"], notes: "Shared catalogue definitions" },
  { permission: PLATFORM_PERMISSIONS.SUPPORT_MANAGE, reaches: ["SupportCase", "SupportMessage (including internal)"], notes: "Customer visible and internal messages stay distinct" },
];

export function permissionsCoveredByPlatformBundles(): Set<PlatformPermission> {
  const covered = new Set<PlatformPermission>();
  for (const bundle of Object.values(PLATFORM_ROLE_BUNDLES)) {
    for (const p of bundle) covered.add(p);
  }
  for (const p of SUPER_ADMIN_EXCLUSIVE) covered.add(p);
  return covered;
}

export function permissionsCoveredByShopBundles(): Set<ShopPermission> {
  const covered = new Set<ShopPermission>();
  for (const bundle of Object.values(SHOP_ROLE_BUNDLES)) {
    for (const p of bundle) covered.add(p);
  }
  for (const p of OWNER_BUNDLE) covered.add(p);
  return covered;
}
