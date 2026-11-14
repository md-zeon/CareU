import type { LocalizedText } from "@/lib/mock/types";

export type PrototypeJourneyScope = "guest" | "customer" | "seller" | "platform";

export type PrototypePersonaKind = "guest" | "customer" | "seller" | "platform";

export type PrototypePersonaOption = {
  id: string;
  label: LocalizedText;
  kind: PrototypePersonaKind;
  description: LocalizedText;
  mockPersonaId?: string;
  shopId?: string;
  platformRole?: string;
  journeyScope: PrototypeJourneyScope;
};

export type PrototypeShortcutArea = "general" | "customer" | "seller" | "platform";

export type PrototypeJourneyShortcut = {
  id: string;
  label: LocalizedText;
  href: string;
  area: PrototypeShortcutArea;
  requiresSignIn: boolean;
  suggestedPersonaId?: string;
  status: "available" | "planned";
};

export type PrototypeSession = {
  activePersonaId: string;
  isPanelOpen: boolean;
  version: number;
};
