// Permission catalog (spec 0002). Names are scope.domain.action and typed so typos fail compilation.

export const SHOP_PERMISSIONS = {
  PROFILE_READ: "shop.profile.read",
  PROFILE_WRITE: "shop.profile.write",
  STAFF_MANAGE: "shop.staff.manage",
  STATUS_MANAGE: "shop.status.manage",
  LISTING_READ: "shop.listing.read",
  LISTING_WRITE: "shop.listing.write",
  LISTING_PUBLISH: "shop.listing.publish",
  LISTING_REMOVE: "shop.listing.remove",
  INVENTORY_READ: "shop.inventory.read",
  INVENTORY_ADJUST: "shop.inventory.adjust",
  INVENTORY_RESTOCK: "shop.inventory.restock",
  ORDER_READ: "shop.order.read",
  FULFILLMENT_MANAGE: "shop.fulfillment.manage",
  RETURN_MANAGE: "shop.return.manage",
  SUPPORT_MANAGE: "shop.support.manage",
  MONEY_READ: "shop.money.read",
} as const;

export type ShopPermission =
  (typeof SHOP_PERMISSIONS)[keyof typeof SHOP_PERMISSIONS];

export const PLATFORM_PERMISSIONS = {
  SHOP_READ: "platform.shop.read",
  SHOP_MODERATE: "platform.shop.moderate",
  SELLER_REVIEW: "platform.seller.review",
  SELLER_DOCUMENT_READ: "platform.seller.document.read",
  SELLER_TRUST_MANAGE: "platform.seller.trust.manage",
  LISTING_MODERATE: "platform.listing.moderate",
  REVIEW_MODERATE: "platform.review.moderate",
  CATEGORY_MANAGE: "platform.category.manage",
  CATALOGUE_MANAGE: "platform.catalogue.manage",
  INVENTORY_MANAGE: "platform.inventory.manage",
  PROCUREMENT_MANAGE: "platform.procurement.manage",
  DELIVERY_MANAGE: "platform.delivery.manage",
  ORDER_READ: "platform.order.read",
  ORDER_MANAGE: "platform.order.manage",
  CUSTOMER_READ: "platform.customer.read",
  SUPPORT_MANAGE: "platform.support.manage",
  DISPUTE_RESOLVE: "platform.dispute.resolve",
  REFUND_REQUEST: "platform.refund.request",
  REFUND_APPROVE: "platform.refund.approve",
  PAYMENT_RECONCILE: "platform.payment.reconcile",
  COMMISSION_MANAGE: "platform.commission.manage",
  LEDGER_READ: "platform.ledger.read",
  PAYOUT_MANAGE: "platform.payout.manage",
  PAYOUT_APPROVE: "platform.payout.approve",
  COD_RECONCILE: "platform.cod.reconcile",
  AUDIT_READ: "platform.audit.read",
  CMS_MANAGE: "platform.cms.manage",
  ROLE_MANAGE: "platform.role.manage",
  THEME_MANAGE: "platform.theme.manage",
} as const;

export type PlatformPermission =
  (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];

export type Permission = ShopPermission | PlatformPermission;

export const ALL_SHOP_PERMISSIONS: readonly ShopPermission[] = Object.values(
  SHOP_PERMISSIONS,
);
export const ALL_PLATFORM_PERMISSIONS: readonly PlatformPermission[] =
  Object.values(PLATFORM_PERMISSIONS);
export const ALL_PERMISSIONS: readonly Permission[] = [
  ...ALL_SHOP_PERMISSIONS,
  ...ALL_PLATFORM_PERMISSIONS,
];
