// Audit action name constants (spec 0002). No free text action names reach AuditLog.

export const AUDIT_ACTIONS = {
  PLATFORM_ROLE_GRANT: "platform.role.grant",
  PLATFORM_ROLE_REVOKE: "platform.role.revoke",
  SHOP_MEMBERSHIP_ASSIGN: "shop.membership.assign",
  SHOP_MEMBERSHIP_REMOVE: "shop.membership.remove",
  SHOP_STATUS_CHANGE: "shop.status.change",
  REFUND_APPROVE: "finance.refund.approve",
  PAYOUT_APPROVE: "finance.payout.approve",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
