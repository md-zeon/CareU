import type { PlatformRoleKey, ShopRoleKey } from "./roles.ts";

export type ActorContext = {
  userId: string;
  platformRoles: PlatformRoleKey[];
  verifiedContact: boolean;
};

export type ShopActorContext = ActorContext & {
  shopId: string;
  shopRole: ShopRoleKey | "OWNER" | null;
  isOwner: boolean;
  isCareuShop: boolean;
};

export type AuthorizationDecision =
  | { status: "ALLOW"; actor: ActorContext | ShopActorContext }
  | { status: "REDIRECT_LOGIN"; returnPath?: string }
  | { status: "FORBIDDEN"; reason?: string }
  | { status: "NOT_FOUND"; reason?: string }
  | { status: "CONTACT_UNVERIFIED"; actor: ActorContext }
  | { status: "SHOP_UNAVAILABLE"; actor: ShopActorContext; reason?: string };

export type GuardErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONTACT_UNVERIFIED"
  | "SHOP_UNAVAILABLE";

export function isAllowed(
  decision: AuthorizationDecision,
): decision is Extract<AuthorizationDecision, { status: "ALLOW" }> {
  return decision.status === "ALLOW";
}

export function decisionErrorCode(
  decision: AuthorizationDecision,
): GuardErrorCode | null {
  switch (decision.status) {
    case "ALLOW":
      return null;
    case "REDIRECT_LOGIN":
      return "UNAUTHENTICATED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "CONTACT_UNVERIFIED":
      return "CONTACT_UNVERIFIED";
    case "SHOP_UNAVAILABLE":
      return "SHOP_UNAVAILABLE";
  }
}

export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw.includes("\\")) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("//") || decoded.includes("\\")) return "/";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return "/";
  } catch {
    return "/";
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return "/";
  return raw;
}
