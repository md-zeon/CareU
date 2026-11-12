/**
 * Roles, permissions, and access control coverage (spec 0002).
 * Focuses on decision logic, shop/platform resolution, CareU mapping, and shop status gates.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma.ts";
import {
  decisionErrorCode,
  isAllowed,
  safeReturnPath,
} from "../lib/authz/decision.ts";
import {
  evaluateOwnership,
  evaluatePlatformPermission,
  effectiveShopPermissions,
  resolveShopAccess,
} from "../lib/authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../lib/authz/permissions.ts";
import {
  CAREU_SHOP_PERMISSION_MAP,
  OWNER_BUNDLE,
  PLATFORM_ROLE_BUNDLES,
  SHOP_ROLE_BUNDLES,
  SUPER_ADMIN_EXCLUSIVE,
} from "../lib/authz/roles.ts";


function suffix() {
  return `ac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("authz decision helpers (AC-4)", () => {
  test("isAllowed and decisionErrorCode map decisions to typed results (covers AC-4)", () => {
    const actor = { userId: "u1", platformRoles: [], verifiedContact: true };
    assert.equal(isAllowed({ status: "ALLOW", actor }), true);
    assert.equal(isAllowed({ status: "FORBIDDEN" }), false);
    assert.equal(decisionErrorCode({ status: "ALLOW", actor }), null);
    assert.equal(decisionErrorCode({ status: "REDIRECT_LOGIN" }), "UNAUTHENTICATED");
    assert.equal(decisionErrorCode({ status: "FORBIDDEN" }), "FORBIDDEN");
    assert.equal(decisionErrorCode({ status: "NOT_FOUND" }), "NOT_FOUND");
    assert.equal(decisionErrorCode({ status: "CONTACT_UNVERIFIED", actor }), "CONTACT_UNVERIFIED");
    assert.equal(
      decisionErrorCode({
        status: "SHOP_UNAVAILABLE",
        actor: { ...actor, shopId: "s", shopRole: null, isOwner: false, isCareuShop: false },
      }),
      "SHOP_UNAVAILABLE",
    );
  });

  test("safeReturnPath rejects open redirects and unsafe paths (covers AC-4)", () => {
    assert.equal(safeReturnPath("/en/account?tab=x"), "/en/account?tab=x");
    assert.equal(safeReturnPath("//evil.example"), "/");
    assert.equal(safeReturnPath("/%2F%2Fevil.example"), "/");
    assert.equal(safeReturnPath("/\\evil"), "/");
    assert.equal(safeReturnPath("javascript:alert(1)"), "/");
    assert.equal(safeReturnPath("https://evil.example"), "/");
    assert.equal(safeReturnPath(""), "/");
    assert.equal(safeReturnPath(null), "/");
    assert.equal(safeReturnPath(undefined), "/");
  });
});

describe("platform permission evaluation (AC-3, AC-5, AC-7, AC-9)", () => {
  test("signed out is redirected to login (covers AC-4)", () => {
    const d = evaluatePlatformPermission(null, PLATFORM_PERMISSIONS.SHOP_READ);
    assert.equal(d.status, "REDIRECT_LOGIN");
  });

  test("super admin passes every permission including exclusive ones (covers AC-9)", () => {
    const actor = { userId: "sa", platformRoles: ["SUPER_ADMIN"] as ("SUPER_ADMIN")[], verifiedContact: true };
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.ROLE_MANAGE).status, "ALLOW");
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.THEME_MANAGE).status, "ALLOW");
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.SHOP_READ).status, "ALLOW");
  });

  test("exclusive permissions are denied to non-super-admin roles (covers AC-9)", () => {
    const actor = { userId: "pa", platformRoles: ["PLATFORM_ADMIN"] as ("PLATFORM_ADMIN")[], verifiedContact: true };
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.ROLE_MANAGE).status, "FORBIDDEN");
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.THEME_MANAGE).status, "FORBIDDEN");
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.SHOP_READ).status, "ALLOW");
  });

  test("platform role holder without verified contact has no effect (covers AC-7)", () => {
    const actor = { userId: "u", platformRoles: ["PLATFORM_ADMIN"] as ("PLATFORM_ADMIN")[], verifiedContact: false };
    const d = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.SHOP_READ);
    assert.equal(d.status, "CONTACT_UNVERIFIED");
  });

  test("missing permission is forbidden for verified holder (covers AC-3, AC-4)", () => {
    const actor = { userId: "u", platformRoles: ["CATALOGUE_PRICING"] as unknown as ("CATALOGUE_PRICING"[]), verifiedContact: true };
    assert.equal(evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.PAYMENT_RECONCILE).status, "FORBIDDEN");
  });
});

describe("ownership evaluation (AC-4)", () => {
  test("ownership allows owner and hides non-owner as not found (covers AC-4)", async () => {
    const owner = { userId: "u1", platformRoles: [], verifiedContact: true };
    assert.equal((await evaluateOwnership(null, "u1")).status, "REDIRECT_LOGIN");
    assert.equal((await evaluateOwnership(owner, "u1")).status, "ALLOW");
    assert.equal((await evaluateOwnership(owner, "u2")).status, "NOT_FOUND");
  });
});

describe("shop access, status gate, and CareU mapping (AC-3, AC-4, AC-8, AC-10)", () => {
  test("owner gets shop permissions, staff limited to own shop and active membership, paused/suspended gate applies (covers AC-3, AC-8, AC-10)", async () => {
    const s = suffix();
    const owner = `u_${s}_o`;
    const staff = `u_${s}_st`;
    const invited = `u_${s}_inv`;
    const outsider = `u_${s}_x`;
    const shop = `s_${s}`;
    await prisma.user.createMany({
      data: [
        { id: owner, name: "O", email: `${owner}@e.test`, emailVerified: true },
        { id: staff, name: "S", email: `${staff}@e.test`, emailVerified: true },
        { id: invited, name: "I", email: `${invited}@e.test`, emailVerified: true },
        { id: outsider, name: "X", email: `${outsider}@e.test`, emailVerified: true },
      ],
    });
    await prisma.shop.create({
      data: { id: shop, ownerUserId: owner, slug: `shop-${s}`, name: "Shop", status: "ACTIVE" },
    });
    await prisma.shopMembership.createMany({
      data: [
        { shopId: shop, userId: staff, role: "FULFILMENT", status: "ACTIVE", acceptedAt: new Date() },
        { shopId: shop, userId: invited, role: "MANAGER", status: "INVITED" },
      ],
    });

    try {
      const ownerActor = { userId: owner, platformRoles: [], verifiedContact: true };
      const staffActor = { userId: staff, platformRoles: [], verifiedContact: true };
      const invitedActor = { userId: invited, platformRoles: [], verifiedContact: true };
      const outsiderActor = { userId: outsider, platformRoles: [], verifiedContact: true };

      // owner allowed for owner-only perms
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.STAFF_MANAGE })).decision.status, "ALLOW");
      // staff allowed for bundle perm, in-scope but missing permission is forbidden (AC-4)
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.FULFILLMENT_MANAGE })).decision.status, "ALLOW");
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.MONEY_READ })).decision.status, "FORBIDDEN");
      // invited grants nothing until active
      assert.equal((await resolveShopAccess({ actor: invitedActor, shopId: shop, permission: SHOP_PERMISSIONS.PROFILE_READ })).decision.status, "NOT_FOUND");
      assert.equal((await effectiveShopPermissions(invited, shop)).size, 0);
      // outsider cannot access
      assert.equal((await resolveShopAccess({ actor: outsiderActor, shopId: shop, permission: SHOP_PERMISSIONS.ORDER_READ })).decision.status, "NOT_FOUND");

      // pause: new selling/restock denied, fulfilment/read allowed
      await prisma.shop.update({ where: { id: shop }, data: { status: "PAUSED" } });
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.LISTING_PUBLISH })).decision.status, "SHOP_UNAVAILABLE");
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.INVENTORY_RESTOCK })).decision.status, "SHOP_UNAVAILABLE");
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.FULFILLMENT_MANAGE })).decision.status, "ALLOW");
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.INVENTORY_ADJUST })).decision.status, "ALLOW");

      // suspend: fulfilment/returns/adjust still allowed, writes denied
      await prisma.shop.update({ where: { id: shop }, data: { status: "SUSPENDED" } });
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.FULFILLMENT_MANAGE })).decision.status, "ALLOW");
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.RETURN_MANAGE })).decision.status, "ALLOW");
      assert.equal((await resolveShopAccess({ actor: staffActor, shopId: shop, permission: SHOP_PERMISSIONS.INVENTORY_ADJUST })).decision.status, "ALLOW");
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.LISTING_WRITE })).decision.status, "SHOP_UNAVAILABLE");
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.PROFILE_WRITE })).decision.status, "SHOP_UNAVAILABLE");
      assert.equal((await resolveShopAccess({ actor: ownerActor, shopId: shop, permission: SHOP_PERMISSIONS.LISTING_REMOVE })).decision.status, "SHOP_UNAVAILABLE");
    } finally {
      await prisma.shopMembership.deleteMany({ where: { shopId: shop } });
      await prisma.shop.deleteMany({ where: { id: shop } });
      await prisma.user.deleteMany({ where: { id: { in: [owner, staff, invited, outsider] } } });
    }
  });

  test("platform roles reach CareU first-party shop via mapping but not seller shops; unverified platform holder denied (covers AC-3, AC-7, AC-10)", async () => {
    const s = suffix();
    const ownerSeller = `u_${s}_os`;
    const ownerCareu = `u_${s}_oc`;
    const platformUser = `u_${s}_p`;
    const sellerShop = `s_${s}_seller`;
    const careuShop = `s_${s}_careu`;
    await prisma.user.createMany({
      data: [
        { id: ownerSeller, name: "OS", email: `${ownerSeller}@e.test`, emailVerified: true },
        { id: ownerCareu, name: "OC", email: `${ownerCareu}@e.test`, emailVerified: true },
        { id: platformUser, name: "P", email: `${platformUser}@e.test`, emailVerified: true },
      ],
    });
    await prisma.shop.createMany({
      data: [
        { id: sellerShop, ownerUserId: ownerSeller, slug: `seller-${s}`, name: "Seller", status: "SUSPENDED" },
        { id: careuShop, ownerUserId: ownerCareu, slug: `careu-${s}`, name: "CareU", status: "ACTIVE", isFirstParty: true },
      ],
    });
    await prisma.platformRoleAssignment.create({
      data: { userId: platformUser, role: "CATALOGUE_PRICING", grantSource: "ADMIN", grantedByUserId: ownerCareu },
    });

    try {
      const actor = { userId: platformUser, platformRoles: ["CATALOGUE_PRICING"] as unknown as ("CATALOGUE_PRICING"[]), verifiedContact: true };
      // mapped perm on CareU shop allowed
      assert.equal((await resolveShopAccess({ actor, shopId: careuShop, permission: SHOP_PERMISSIONS.LISTING_WRITE })).decision.status, "ALLOW");
      // unmapped shop perm denied on CareU shop for in-scope platform actor (AC-4)
      assert.equal((await resolveShopAccess({ actor, shopId: careuShop, permission: SHOP_PERMISSIONS.MONEY_READ })).decision.status, "FORBIDDEN");
      // seller shop not reachable via shop-scoped mapping
      assert.equal((await resolveShopAccess({ actor, shopId: sellerShop, permission: SHOP_PERMISSIONS.LISTING_READ })).decision.status, "NOT_FOUND");

      // unverified platform role holder gets no mapped access
      await prisma.user.update({ where: { id: platformUser }, data: { emailVerified: false, phoneNumberVerified: false } });
      const permsUnverified = await effectiveShopPermissions(platformUser, careuShop);
      assert.equal(permsUnverified.has(SHOP_PERMISSIONS.LISTING_WRITE), false);

      // suspension of seller shop never changes CareU reach
      await prisma.user.update({ where: { id: platformUser }, data: { emailVerified: true } });
      const actorVerified = { userId: platformUser, platformRoles: ["CATALOGUE_PRICING"] as unknown as ("CATALOGUE_PRICING"[]), verifiedContact: true };
      assert.equal((await resolveShopAccess({ actor: actorVerified, shopId: careuShop, permission: SHOP_PERMISSIONS.LISTING_READ })).decision.status, "ALLOW");
    } finally {
      await prisma.platformRoleAssignment.deleteMany({ where: { userId: platformUser } });
      await prisma.shop.deleteMany({ where: { id: { in: [sellerShop, careuShop] } } });
      await prisma.user.deleteMany({ where: { id: { in: [ownerSeller, ownerCareu, platformUser] } } });
    }
  });
});

describe("role and permission contracts (AC-2, AC-9)", () => {
  test("shop role bundles match expected separation (covers AC-2, AC-9 intent)", () => {
    // MANAGER has money and ops but not staff/status manage
    assert.ok(SHOP_ROLE_BUNDLES.MANAGER.has(SHOP_PERMISSIONS.MONEY_READ));
    assert.equal(SHOP_ROLE_BUNDLES.MANAGER.has(SHOP_PERMISSIONS.STAFF_MANAGE), false);
    assert.equal(SHOP_ROLE_BUNDLES.MANAGER.has(SHOP_PERMISSIONS.STATUS_MANAGE), false);
    // CATALOGUE cannot fulfil or read money
    assert.ok(SHOP_ROLE_BUNDLES.CATALOGUE.has(SHOP_PERMISSIONS.LISTING_PUBLISH));
    assert.equal(SHOP_ROLE_BUNDLES.CATALOGUE.has(SHOP_PERMISSIONS.FULFILLMENT_MANAGE), false);
    assert.equal(SHOP_ROLE_BUNDLES.CATALOGUE.has(SHOP_PERMISSIONS.MONEY_READ), false);
    // SUPPORT limited
    assert.ok(SHOP_ROLE_BUNDLES.SUPPORT.has(SHOP_PERMISSIONS.SUPPORT_MANAGE));
    assert.equal(SHOP_ROLE_BUNDLES.SUPPORT.has(SHOP_PERMISSIONS.INVENTORY_ADJUST), false);
    // owner bundle has all
    for (const p of Object.values(SHOP_PERMISSIONS)) assert.ok(OWNER_BUNDLE.has(p));
  });

  test("platform bundles enforce support/finance separation (covers AC-9)", () => {
    const support = PLATFORM_ROLE_BUNDLES.CUSTOMER_SUPPORT;
    assert.ok(support.has(PLATFORM_PERMISSIONS.REFUND_REQUEST));
    assert.equal(support.has(PLATFORM_PERMISSIONS.REFUND_APPROVE), false);
    assert.equal(support.has(PLATFORM_PERMISSIONS.PAYMENT_RECONCILE), false);
    assert.equal(support.has(PLATFORM_PERMISSIONS.LEDGER_READ), false);
    assert.equal(support.has(PLATFORM_PERMISSIONS.PAYOUT_MANAGE), false);
    assert.equal(support.has(PLATFORM_PERMISSIONS.COD_RECONCILE), false);

    const finance = PLATFORM_ROLE_BUNDLES.FINANCE_SETTLEMENTS;
    assert.ok(finance.has(PLATFORM_PERMISSIONS.REFUND_APPROVE));
    assert.ok(finance.has(PLATFORM_PERMISSIONS.PAYOUT_APPROVE));
    assert.ok(finance.has(PLATFORM_PERMISSIONS.PAYOUT_MANAGE));
    assert.equal(finance.has(PLATFORM_PERMISSIONS.REFUND_REQUEST), false);
    assert.equal(finance.has(PLATFORM_PERMISSIONS.SUPPORT_MANAGE), false);
  });

  test("CareU shop mapping grants only mapped shop permissions and excludes staff/status manage (covers AC-3)", () => {
    const financeMap = CAREU_SHOP_PERMISSION_MAP.FINANCE_SETTLEMENTS;
    assert.ok(financeMap.has(SHOP_PERMISSIONS.ORDER_READ));
    assert.ok(financeMap.has(SHOP_PERMISSIONS.MONEY_READ));
    assert.equal(financeMap.has(SHOP_PERMISSIONS.STAFF_MANAGE), false);
    assert.equal(financeMap.has(SHOP_PERMISSIONS.STATUS_MANAGE), false);
    assert.ok(SUPER_ADMIN_EXCLUSIVE.has(PLATFORM_PERMISSIONS.ROLE_MANAGE));
  });
});

