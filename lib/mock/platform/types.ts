import type { LocalizedText } from "../types";

export type MockModerationItem = {
  id: string;
  targetType: "seller_application" | "shop" | "listing" | "review";
  targetId: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  reason: LocalizedText;
  submittedAt: string;
};

export type MockDeliveryAssignment = {
  id: string;
  shipmentId: string;
  assigneeLabel: LocalizedText;
  status: "unassigned" | "assigned" | "picked_up" | "completed";
  scheduledAt?: string;
  updatedAt: string;
};

export type MockNotification = {
  id: string;
  audience: "customer" | "seller" | "platform" | "persona";
  personaId?: string;
  channel: "in_app" | "email";
  title: LocalizedText;
  body: LocalizedText;
  status: "unread" | "read" | "sent";
};

export type MockContentBlock = {
  id: string;
  key: string;
  scope: "home" | "policy" | "theme" | "page";
  title: LocalizedText;
  body: LocalizedText;
  status: "draft" | "published";
};

export type MockAnalyticsCard = {
  id: string;
  key: string;
  title: LocalizedText;
  value: string | number;
  periodLabel: LocalizedText;
  status: "up" | "down" | "neutral";
};
