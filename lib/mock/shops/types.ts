import type { LocalizedText } from "../types";

export type MockShop = {
  id: string;
  slug: string;
  name: LocalizedText;
  type: "careu" | "third_party";
  status: "active" | "paused" | "suspended" | "pending";
  logo?: string;
  rating?: number;
};

export type MockSellerApplication = {
  id: string;
  applicantPersonaId: string;
  type: "individual" | "business";
  status: "draft" | "submitted" | "approved" | "rejected" | "needs_changes";
  submittedAt?: string;
  documentRefs: string[];
  reviewNotes?: LocalizedText;
};

export type MockSellerStaff = {
  id: string;
  shopId: string;
  personaId: string;
  roleLabel: LocalizedText;
  status: "active" | "invited" | "removed";
};
