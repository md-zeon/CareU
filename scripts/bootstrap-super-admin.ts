import { prisma } from "../lib/prisma.ts";
import {
  AUTHZ_RATE_LIMITS,
  authzRateLimitKey,
  consumeAuthzRateLimit,
} from "../lib/authz/rate-limit.ts";

async function main() {
  const email = process.env.PLATFORM_SUPER_ADMIN_EMAIL?.trim();
  if (!email) {
    console.error("PLATFORM_SUPER_ADMIN_EMAIL is required");
    process.exit(1);
  }

  const rl = await consumeAuthzRateLimit(
    authzRateLimitKey("bootstrap", email),
    AUTHZ_RATE_LIMITS.bootstrap,
  );
  if (!rl.allowed) {
    console.error("bootstrap: rate limited; try again later");
    process.exit(1);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true, phoneNumberVerified: true },
      });
      if (!user || (!user.emailVerified && !user.phoneNumberVerified)) {
        throw new Error("USER_MISSING_OR_UNVERIFIED");
      }

      const existingSuperAdmin = await tx.platformRoleAssignment.findFirst({
        where: { role: "SUPER_ADMIN", revokedAt: null },
        select: { id: true },
      });
      if (existingSuperAdmin) {
        return { status: "noop" as const };
      }

      const existing = await tx.platformRoleAssignment.findFirst({
        where: { userId: user.id, role: "SUPER_ADMIN", revokedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { status: "noop" as const };
      }

      const assignment = await tx.platformRoleAssignment.create({
        data: {
          userId: user.id,
          role: "SUPER_ADMIN",
          grantSource: "BOOTSTRAP",
          grantedByUserId: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: null,
          actorScope: "system",
          action: "platform.role.grant",
          entityType: "PlatformRoleAssignment",
          entityId: assignment.id,
          reason: "bootstrap",
          after: {
            userId: user.id,
            role: "SUPER_ADMIN",
            grantSource: "BOOTSTRAP",
          },
          metadata: { bootstrap: true },
        },
      });

      return { status: "granted" as const, assignmentId: assignment.id };
    });

    if (result.status === "noop") {
      console.log("bootstrap: no changes (live super admin already exists)");
      process.exit(0);
    }
    console.log(`bootstrap: granted SUPER_ADMIN (${result.assignmentId})`);
    process.exit(0);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("USER_MISSING_OR_UNVERIFIED")) {
      console.error("bootstrap: user missing or unverified; no grant made");
      process.exit(1);
    }
    console.error("bootstrap: failed", e);
    process.exit(1);
  }
}

main();
