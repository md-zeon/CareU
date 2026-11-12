import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/authz/guards";
import { PLATFORM_PERMISSIONS } from "@/lib/authz/permissions";
import { getActor } from "@/lib/authz/actor";
import { safeReturnPath } from "@/lib/authz/decision";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnPath = safeReturnPath(url.searchParams.get("return"));
  const decision = await requirePlatformPermission(PLATFORM_PERMISSIONS.ROLE_MANAGE);

  if (decision.status === "REDIRECT_LOGIN") {
    const loginUrl = new URL(`/en/login?return=${encodeURIComponent(returnPath)}`, url.origin);
    return NextResponse.redirect(loginUrl, 302);
  }
  if (decision.status === "FORBIDDEN" || decision.status === "CONTACT_UNVERIFIED" || decision.status === "SHOP_UNAVAILABLE") {
    return NextResponse.json({ error: decision.status }, { status: 403 });
  }
  if (decision.status === "NOT_FOUND") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const actor = await getActor();
  return NextResponse.json({ ok: true, actor });
}
