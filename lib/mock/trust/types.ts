import type { LocalizedText } from "../types";

export type MockReview = {
  id: string;
  productId: string;
  authorPersonaId: string;
  rating: number;
  title: LocalizedText;
  body: LocalizedText;
  status: "published" | "pending" | "hidden";
  createdAt: string;
};

export type MockSupportCase = {
  id: string;
  orderId?: string;
  shipmentId?: string;
  customerPersonaId: string;
  category: "order" | "payment" | "delivery" | "return" | "other";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  summary: LocalizedText;
};

export type MockDispute = {
  id: string;
  orderId: string;
  shipmentId?: string;
  itemId?: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  reason: LocalizedText;
  requestedAmountBdt?: number;
  refundAmountBdt?: number;
};

export type MockReturn = {
  id: string;
  orderId: string;
  shipmentId?: string;
  itemId?: string;
  status: "requested" | "approved" | "received" | "refunded" | "rejected";
  reason: LocalizedText;
  requestedAmountBdt?: number;
  refundAmountBdt?: number;
};
