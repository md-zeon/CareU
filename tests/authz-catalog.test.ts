/**
 * Permission catalog and role bundle completeness (spec 0002, AC-2).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PLATFORM_PERMISSIONS,
  ALL_SHOP_PERMISSIONS,
} from "../lib/authz/permissions.ts";
import {
  OWNER_BUNDLE,
  SUPER_ADMIN_EXCLUSIVE,
  permissionsCoveredByPlatformBundles,
  permissionsCoveredByShopBundles,
} from "../lib/authz/roles.ts";

describe("Authz catalog completeness (spec 0002, AC-2)", () => {
  test("every platform permission belongs to at least one platform role bundle or the super admin exclusive set", () => {
    const covered = permissionsCoveredByPlatformBundles();
    for (const p of ALL_PLATFORM_PERMISSIONS) {
      assert.ok(
        covered.has(p) || SUPER_ADMIN_EXCLUSIVE.has(p),
        `Platform permission ${p} is not covered by any platform bundle or exclusive set`,
      );
    }
  });

  test("every shop permission belongs to at least one shop role bundle or the owner bundle", () => {
    const covered = permissionsCoveredByShopBundles();
    for (const p of ALL_SHOP_PERMISSIONS) {
      assert.ok(
        covered.has(p) || OWNER_BUNDLE.has(p),
        `Shop permission ${p} is not covered by any shop bundle or owner bundle`,
      );
    }
  });

  test("exclusive permissions are only in the super admin exclusive set intent (checked before bundles)", () => {
    assert.ok(SUPER_ADMIN_EXCLUSIVE.has("platform.role.manage"));
    assert.ok(SUPER_ADMIN_EXCLUSIVE.has("platform.theme.manage"));
  });
});
