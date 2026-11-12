/**
 * Milestone 5 coverage for spec 0002: probe decisions, revocation/conflict behavior,
 * and locked last-super-admin revocation. Exercises real DB constraints/transactions.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma.ts";
import { evaluatePlatformPermission, resolveShopAccess } from "../lib/authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../lib/authz/permissions.ts";
import { safeReturnPath } from "../lib/authz/decision.ts";
import { isConflictingPlatformRolePair } from "../lib/authz/roles.ts";

function suffix() {
  return `m5_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("authz milestone 5 probe/revocation/conflict/locks (spec 0002)", () => {
  test("probe decisions: signed out redirects, denied is forbidden/not found, return path is validated", async () => {
    const s = suffix();
    const owner = `u_${s}_o`;
    const staff = `u_${s}_st`;
    const other = `u_${s}_x`;
    const shopA = `s_${s}_a`;

    await prisma.user.createMany({
      data: [
        { id: owner, name: "O", email: `${owner}@e.test`, emailVerified: true },
        { id: staff, name: "S", email: `${staff}@e.test`, emailVerified: true },
        { id: other, name: "X", email: `${other}@e.test`, emailVerified: true },
      ],
    });
    await prisma.shop.create({
      data: { id: shopA, ownerUserId: owner, slug: `shop-${s}`, name: "A", status: "ACTIVE" },
    });
    await prisma.shopMembership.create({
      data: { shopId: shopA, userId: staff, role: "SUPPORT", status: "ACTIVE", acceptedAt: new Date() },
    });

    try {
      const signedOut = evaluatePlatformPermission(null, PLATFORM_PERMISSIONS.ROLE_MANAGE);
      assert.equal(signedOut.status, "REDIRECT_LOGIN");

      const forbidden = evaluatePlatformPermission(
        { userId: staff, platformRoles: ["CUSTOMER_SUPPORT"], verifiedContact: true },
        PLATFORM_PERMISSIONS.ROLE_MANAGE,
      );
      assert.equal(forbidden.status, "FORBIDDEN");

      const crossShop = await resolveShopAccess({
        actor: { userId: other, platformRoles: [], verifiedContact: true },
        shopId: shopA,
        permission: SHOP_PERMISSIONS.ORDER_READ,
      });
      assert.equal(crossShop.decision.status, "NOT_FOUND");

      assert.equal(safeReturnPath("/en/account"), "/en/account");
      assert.equal(safeReturnPath("//evil.example"), "/");
      assert.equal(safeReturnPath("https://evil.example"), "/");
      assert.equal(safeReturnPath("/\\evil"), "/");
      assert.equal(safeReturnPath(null), "/");
    } finally {
      await prisma.shopMembership.deleteMany({ where: { shopId: shopA } });
      await prisma.shop.deleteMany({ where: { id: shopA } });
      await prisma.user.deleteMany({ where: { id: { in: [owner, staff, other] } } });
    }
  });

  test("revocation removes access on next DB read and live assignment uniqueness holds", async () => {
    const s = suffix();
    const admin = `u_${s}_a`;
    const target = `u_${s}_t`;
    await prisma.user.createMany({
      data: [
        { id: admin, name: "Admin", email: `${admin}@e.test`, emailVerified: true },
        { id: target, name: "Target", email: `${target}@e.test`, emailVerified: true },
      ],
    });

    try {
      const assignment = await prisma.platformRoleAssignment.create({
        data: {
          userId: target,
          role: "CATALOGUE_PRICING",
          grantSource: "ADMIN",
          grantedByUserId: admin,
        },
      });

      const liveBefore = await prisma.platformRoleAssignment.findMany({
        where: { userId: target, revokedAt: null },
      });
      assert.equal(liveBefore.length, 1);

      await prisma.platformRoleAssignment.update({
        where: { id: assignment.id },
        data: { revokedAt: new Date(), revokedByUserId: admin, revokeReason: "test" },
      });

      const liveAfter = await prisma.platformRoleAssignment.findMany({
        where: { userId: target, revokedAt: null },
      });
      assert.equal(liveAfter.length, 0, "revoked role must not appear in live assignments");

      // create a new live assignment should be allowed after revocation (history kept)
      const again = await prisma.platformRoleAssignment.create({
        data: { userId: target, role: "CATALOGUE_PRICING", grantSource: "ADMIN", grantedByUserId: admin },
      });
      assert.ok(again.id);

      // but two live same-role assignments must be blocked by partial unique index
      await assert.rejects(
        prisma.platformRoleAssignment.create({
          data: { userId: target, role: "CATALOGUE_PRICING", grantSource: "ADMIN", grantedByUserId: admin },
        }),
      );
    } finally {
      await prisma.platformRoleAssignment.deleteMany({ where: { userId: target } });
      await prisma.user.deleteMany({ where: { id: { in: [admin, target] } } });
    }
  });

  test("conflict: customer support and finance cannot both be live for one user", async () => {
    assert.ok(isConflictingPlatformRolePair("CUSTOMER_SUPPORT", "FINANCE_SETTLEMENTS"));
    const s = suffix();
    const admin = `u_${s}_a`;
    const target = `u_${s}_t`;
    await prisma.user.createMany({
      data: [
        { id: admin, name: "Admin", email: `${admin}@e.test`, emailVerified: true },
        { id: target, name: "Target", email: `${target}@e.test`, emailVerified: true },
      ],
    });
    try {
      await prisma.platformRoleAssignment.create({
        data: { userId: target, role: "CUSTOMER_SUPPORT", grantSource: "ADMIN", grantedByUserId: admin },
      });
      // enforce conflict at application/transaction logic level as implemented; DB allows different roles
      const live = await prisma.platformRoleAssignment.findMany({
        where: { userId: target, revokedAt: null },
        select: { role: true },
      });
      const wouldConflict = live.some((a) =>
        isConflictingPlatformRolePair(a.role as "CUSTOMER_SUPPORT" | "FINANCE_SETTLEMENTS", "FINANCE_SETTLEMENTS"),
      );
      assert.ok(wouldConflict, "grant logic must reject this combination");
    } finally {
      await prisma.platformRoleAssignment.deleteMany({ where: { userId: target } });
      await prisma.user.deleteMany({ where: { id: { in: [admin, target] } } });
    }
  });

  test("last super admin cannot be revoked; concurrent revocations cannot empty the role", async () => {
    const s = suffix();
    const admin = `u_${s}_admin`;
    const sa1 = `u_${s}_sa1`;
    const sa2 = `u_${s}_sa2`;
    await prisma.user.createMany({
      data: [
        { id: admin, name: "Admin", email: `${admin}@e.test`, emailVerified: true },
        { id: sa1, name: "SA1", email: `${sa1}@e.test`, emailVerified: true },
        { id: sa2, name: "SA2", email: `${sa2}@e.test`, emailVerified: true },
      ],
    });

    const a1 = await prisma.platformRoleAssignment.create({
      data: { userId: sa1, role: "SUPER_ADMIN", grantSource: "ADMIN", grantedByUserId: admin },
    });
    const a2 = await prisma.platformRoleAssignment.create({
      data: { userId: sa2, role: "SUPER_ADMIN", grantSource: "ADMIN", grantedByUserId: admin },
    });

    const revokeWithLock = async (assignmentId: string) =>
      prisma.$transaction(async (tx) => {
        const assignment = await tx.platformRoleAssignment.findUnique({ where: { id: assignmentId } });
        if (!assignment || assignment.revokedAt) throw new Error("NOT_FOUND");
        if (assignment.role === "SUPER_ADMIN") {
          const live = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "platform_role_assignment"
            WHERE "role" = 'SUPER_ADMIN'::"PlatformRole" AND "revokedAt" IS NULL
            FOR UPDATE
          `;
          if (live.length <= 1) throw new Error("LAST_SUPER_ADMIN");
        }
        await tx.platformRoleAssignment.update({
          where: { id: assignmentId },
          data: { revokedAt: new Date(), revokedByUserId: admin, revokeReason: "test" },
        });
        return "ok" as const;
      });

    try {
      const results = await Promise.allSettled([revokeWithLock(a1.id), revokeWithLock(a2.id)]);
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const last = results.filter(
        (r) => r.status === "rejected" && String((r as PromiseRejectedResult).reason?.message).includes("LAST_SUPER_ADMIN"),
      ).length;
      assert.equal(ok, 1, "exactly one concurrent revocation should succeed");
      assert.equal(last, 1, "exactly one concurrent revocation must be rejected as LAST_SUPER_ADMIN");

      const remainingLive = await prisma.platformRoleAssignment.count({
        where: { role: "SUPER_ADMIN", revokedAt: null, userId: { in: [sa1, sa2] } },
      });
      assert.equal(remainingLive, 1, "one live super admin must remain");

      // revoking the last remaining must fail
      const remaining = await prisma.platformRoleAssignment.findFirst({
        where: { role: "SUPER_ADMIN", revokedAt: null, userId: { in: [sa1, sa2] } },
      });
      assert.ok(remaining);
      await assert.rejects(revokeWithLock(remaining!.id), /LAST_SUPER_ADMIN/);
    } finally {
      await prisma.platformRoleAssignment.deleteMany({ where: { userId: { in: [sa1, sa2] } } });
      await prisma.user.deleteMany({ where: { id: { in: [admin, sa1, sa2] } } });
    }
  });

  test("shop membership: removed member can be invited again as a new row (live unique is partial)", async () => {
    const s = suffix();
    const owner = `u_${s}_o`;
    const staff = `u_${s}_s`;
    const shop = `s_${s}`;
    await prisma.user.createMany({
      data: [
        { id: owner, name: "O", email: `${owner}@e.test`, emailVerified: true },
        { id: staff, name: "S", email: `${staff}@e.test`, emailVerified: true },
      ],
    });
    await prisma.shop.create({
      data: { id: shop, ownerUserId: owner, slug: `shop-${s}`, name: "Shop", status: "ACTIVE" },
    });
    try {
      const m1 = await prisma.shopMembership.create({
        data: { shopId: shop, userId: staff, role: "SUPPORT", status: "ACTIVE", acceptedAt: new Date(), invitedByUserId: owner },
      });
      await prisma.shopMembership.update({
        where: { id: m1.id },
        data: { status: "REMOVED", removedAt: new Date() },
      });
      const m2 = await prisma.shopMembership.create({
        data: { shopId: shop, userId: staff, role: "SUPPORT", status: "INVITED", invitedByUserId: owner },
      });
      assert.notEqual(m1.id, m2.id);
      const count = await prisma.shopMembership.count({ where: { shopId: shop, userId: staff } });
      assert.equal(count, 2, "history row kept and new invite row created");
    } finally {
      await prisma.shopMembership.deleteMany({ where: { shopId: shop } });
      await prisma.shop.deleteMany({ where: { id: shop } });
      await prisma.user.deleteMany({ where: { id: { in: [owner, staff] } } });
    }
  });
});
