import type { LocalizedText } from "../types";

export type MockInventoryView = {
  id: string;
  shopId: string;
  listingId: string;
  variantId?: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStock: boolean;
  movementSummary: LocalizedText;
};

export type MockPayout = {
  id: string;
  shopId: string;
  periodLabel: LocalizedText;
  status: "pending" | "processing" | "paid" | "failed";
  amountBdt: number;
  methodLabel: LocalizedText;
  reference?: string;
};

export type MockSettlement = {
  id: string;
  shopId: string;
  periodLabel: LocalizedText;
  status: "draft" | "ready" | "settled";
  amountBdt: number;
  orderRefs: string[];
};

export type MockCommissionSummary = {
  id: string;
  shopId: string;
  orderId?: string;
  basis: LocalizedText;
  rateLabel: string;
  amountBdt: number;
};
