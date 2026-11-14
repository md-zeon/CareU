import type { LocalizedText } from "../types";

export type MockPersonaKind = "guest" | "customer" | "seller_owner" | "seller_staff" | "platform";

export type MockPersona = {
  id: string;
  kind: MockPersonaKind;
  displayName: LocalizedText | string;
  contactLabel?: string;
  shopId?: string;
  platformRole?: "platform_admin" | "catalog_pricing" | "inventory_procurement" | "delivery_ops" | "customer_support" | "finance_settlements";
  scopeLabel?: LocalizedText;
};
