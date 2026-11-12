import type { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../prisma.ts";
import { AUDIT_ACTIONS } from "./audit-actions.ts";
import { getActor } from "./actor.ts";
import {
  isConflictingPlatformRolePair,
  type PlatformRoleKey,
  type ShopRoleKey,
} from "./roles.ts";
import { PLATFORM_PERMISSIONS } from "./permissions.ts";
import { requirePlatformPermission, requireShopPermission } from "./guards.ts";
import {
  AUTHZ_RATE_LIMITS,
  authzRateLimitKey,
  consumeAuthzRateLimit,
} from "./rate-limit.ts";
import type { AuthorizationDecision } from "./decision.ts";

type ActionOk<T> = { ok: true; data: T };
type ActionErr = { ok: false; error: string; reason?: string };
export type ActionResult<T> = ActionOk<T> | ActionErr;

function err(error: string, reason?: string): ActionErr {
  return { ok: false, error, reason };
}

function ok<T>(data: T): ActionOk<T> {
  return { ok: true, data };
}

async function auditInTx(
  tx: Prisma.TransactionClient,
  params: {
    actorUserId: string | null;
    actorScope: string;
    action: string;
    entityType: string;
    entityId: string;
    shopId?: string | null;
    reason?: string | null;
    before?: Prisma.InputJsonValue | null;
    after?: Prisma.InputJsonValue | null;
    metadata?: Prisma.InputJsonValue | null;
  },
) {
  await tx.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      actorScope: params.actorScope,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      shopId: params.shopId ?? null,
      reason: params.reason ?? null,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
      metadata: params.metadata ?? undefined,
    },
  });
}

function ensureAllowed(decision: AuthorizationDecision): ActionErr | null {
  if (decision.status === "ALLOW") return null;
  return err(decision.status);
}

function errorCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export async function grantPlatformRole(input: {
  targetUserId: string;
  role: PlatformRoleKey;
  reason?: string;
}): Promise<ActionResult<{ assignmentId: string }>> {
  const guard = await requirePlatformPermission(PLATFORM_PERMISSIONS.ROLE_MANAGE);
  const denied = ensureAllowed(guard);
  if (denied) return denied;
  const actor = (guard as Extract<AuthorizationDecision, { status: "ALLOW" }>).actor;

  const rl = await consumeAuthzRateLimit(
    authzRateLimitKey("platform_role_grant", actor.userId),
    AUTHZ_RATE_LIMITS.roleMutation,
  );
  if (!rl.allowed) return err("RATE_LIMITED");

  if (actor.userId === input.targetUserId) return err("SELF_GRANT");

  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, emailVerified: true, phoneNumberVerified: true },
  });
  if (!target) return err("TARGET_NOT_FOUND");
  if (!target.emailVerified && !target.phoneNumberVerified) {
    return err("TARGET_UNVERIFIED");
  }

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      // conflict check against live assignments
      const live = await tx.platformRoleAssignment.findMany({
        where: { userId: input.targetUserId, revokedAt: null },
        select: { role: true },
      });
      for (const a of live) {
        if (a.role === input.role) {
          throw new Error("DUPLICATE");
        }
        if (isConflictingPlatformRolePair(a.role as PlatformRoleKey, input.role)) {
          throw new Error("ROLE_CONFLICT");
        }
      }

      const created = await tx.platformRoleAssignment.create({
        data: {
          userId: input.targetUserId,
          role: input.role,
          grantSource: "ADMIN",
          grantedByUserId: actor.userId,
        },
      });

      await auditInTx(tx, {
        actorUserId: actor.userId,
        actorScope: "platform",
        action: AUDIT_ACTIONS.PLATFORM_ROLE_GRANT,
        entityType: "PlatformRoleAssignment",
        entityId: created.id,
        reason: input.reason ?? null,
        after: {
          userId: input.targetUserId,
          role: input.role,
          grantSource: "ADMIN",
        },
      });

      return created;
    });

    return ok({ assignmentId: assignment.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DUPLICATE")) return err("DUPLICATE");
    if (msg.includes("ROLE_CONFLICT")) return err("ROLE_CONFLICT");
    // unique constraint race
    if (errorCode(e) === "P2002") return err("DUPLICATE");
    throw e;
  }
}

export async function revokePlatformRole(input: {
  assignmentId: string;
  reason: string;
}): Promise<ActionResult<void>> {
  const guard = await requirePlatformPermission(PLATFORM_PERMISSIONS.ROLE_MANAGE);
  const denied = ensureAllowed(guard);
  if (denied) return denied;
  const actor = (guard as Extract<AuthorizationDecision, { status: "ALLOW" }>).actor;
  if (!input.reason?.trim()) return err("REASON_REQUIRED");

  const rl = await consumeAuthzRateLimit(
    authzRateLimitKey("platform_role_revoke", actor.userId),
    AUTHZ_RATE_LIMITS.roleMutation,
  );
  if (!rl.allowed) return err("RATE_LIMITED");

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.platformRoleAssignment.findUnique({
        where: { id: input.assignmentId },
      });
      if (!assignment || assignment.revokedAt) {
        throw new Error("NOT_FOUND");
      }

      if (assignment.role === "SUPER_ADMIN") {
        // lock live super admin rows and count
        const live = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "platform_role_assignment"
          WHERE "role" = 'SUPER_ADMIN'::"PlatformRole" AND "revokedAt" IS NULL
          FOR UPDATE
        `;
        if (live.length <= 1) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }

      const updated = await tx.platformRoleAssignment.update({
        where: { id: input.assignmentId },
        data: {
          revokedAt: new Date(),
          revokedByUserId: actor.userId,
          revokeReason: input.reason,
        },
      });

      await auditInTx(tx, {
        actorUserId: actor.userId,
        actorScope: "platform",
        action: AUDIT_ACTIONS.PLATFORM_ROLE_REVOKE,
        entityType: "PlatformRoleAssignment",
        entityId: updated.id,
        reason: input.reason,
        before: { userId: assignment.userId, role: assignment.role, revokedAt: null },
        after: { userId: assignment.userId, role: assignment.role, revokedAt: updated.revokedAt },
      });
    });
    return ok(undefined);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NOT_FOUND")) return err("NOT_FOUND");
    if (msg.includes("LAST_SUPER_ADMIN")) return err("LAST_SUPER_ADMIN");
    throw e;
  }
}

export async function assignShopRole(input: {
  shopId: string;
  targetUserId: string;
  role: ShopRoleKey;
  reason: string;
}): Promise<ActionResult<{ membershipId: string }>> {
  // Owner only; spec says shop owner assigns/removes within their own shop.
  // We resolve shop and ensure actor is owner.
  const actorCtx = await getActor();
  if (!actorCtx) return err("UNAUTHENTICATED");
  if (!input.reason?.trim()) return err("REASON_REQUIRED");

  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { id: true, ownerUserId: true },
  });
  if (!shop) return err("NOT_FOUND");
  if (shop.ownerUserId !== actorCtx.userId) return err("NOT_OWNER");

  const rl = await consumeAuthzRateLimit(
    authzRateLimitKey("shop_membership_assign", actorCtx.userId),
    AUTHZ_RATE_LIMITS.roleMutation,
  );
  if (!rl.allowed) return err("RATE_LIMITED");

  // shop-scoped permission check for owner context is implicit by ownership; but keep guard semantics consistent
  const guard = await requireShopPermission(input.shopId, "shop.staff.manage");
  // owners have staff.manage in OWNER_BUNDLE; if shop status blocks, guard returns SHOP_UNAVAILABLE (but staff.manage allowed in all statuses per gate)
  const denied = ensureAllowed(guard);
  if (denied) return denied;

  if (input.targetUserId === shop.ownerUserId) return err("OWNER_CANNOT_BE_ASSIGNED");

  try {
    const membership = await prisma.$transaction(async (tx) => {
      const existing = await tx.shopMembership.findFirst({
        where: { shopId: input.shopId, userId: input.targetUserId, status: { not: "REMOVED" } },
        select: { id: true, status: true },
      });
      if (existing && existing.status === "ACTIVE") throw new Error("ALREADY_ACTIVE");
      if (existing && existing.status === "INVITED") throw new Error("ALREADY_ACTIVE");

      const created = await tx.shopMembership.create({
        data: {
          shopId: input.shopId,
          userId: input.targetUserId,
          role: input.role,
          status: "INVITED",
          invitedByUserId: actorCtx.userId,
        },
      });

      await auditInTx(tx, {
        actorUserId: actorCtx.userId,
        actorScope: input.shopId,
        action: AUDIT_ACTIONS.SHOP_MEMBERSHIP_ASSIGN,
        entityType: "ShopMembership",
        entityId: created.id,
        shopId: input.shopId,
        reason: input.reason,
        after: { shopId: input.shopId, userId: input.targetUserId, role: input.role, status: "INVITED" },
      });

      return created;
    });
    return ok({ membershipId: membership.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("ALREADY_ACTIVE")) return err("ALREADY_ACTIVE");
    if (errorCode(e) === "P2002") return err("ALREADY_ACTIVE");
    throw e;
  }
}

export async function removeShopMembership(input: {
  shopId: string;
  membershipId: string;
  reason: string;
}): Promise<ActionResult<void>> {
  const actorCtx = await getActor();
  if (!actorCtx) return err("UNAUTHENTICATED");
  if (!input.reason?.trim()) return err("REASON_REQUIRED");

  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { id: true, ownerUserId: true },
  });
  if (!shop) return err("NOT_FOUND");
  if (shop.ownerUserId !== actorCtx.userId) return err("NOT_OWNER");

  const rl = await consumeAuthzRateLimit(
    authzRateLimitKey("shop_membership_remove", actorCtx.userId),
    AUTHZ_RATE_LIMITS.roleMutation,
  );
  if (!rl.allowed) return err("RATE_LIMITED");

  const guard = await requireShopPermission(input.shopId, "shop.staff.manage");
  const denied = ensureAllowed(guard);
  if (denied) return denied;

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.shopMembership.findUnique({
        where: { id: input.membershipId },
      });
      if (!membership || membership.shopId !== input.shopId) throw new Error("NOT_FOUND");
      if (membership.userId === shop.ownerUserId) throw new Error("OWNER_CANNOT_BE_REMOVED");
      if (membership.status === "REMOVED") throw new Error("NOT_FOUND");

      const updated = await tx.shopMembership.update({
        where: { id: input.membershipId },
        data: { status: "REMOVED", removedAt: new Date() },
      });

      await auditInTx(tx, {
        actorUserId: actorCtx.userId,
        actorScope: input.shopId,
        action: AUDIT_ACTIONS.SHOP_MEMBERSHIP_REMOVE,
        entityType: "ShopMembership",
        entityId: updated.id,
        shopId: input.shopId,
        reason: input.reason,
        before: { userId: membership.userId, role: membership.role, status: membership.status },
        after: { userId: membership.userId, role: membership.role, status: "REMOVED" },
      });
    });
    return ok(undefined);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NOT_FOUND")) return err("NOT_FOUND");
    if (msg.includes("OWNER_CANNOT_BE_REMOVED")) return err("OWNER_CANNOT_BE_REMOVED");
    throw e;
  }
}

export async function approveRefund(input: {
  refundId: string;
  reason: string;
}): Promise<ActionResult<{ refundId: string; status: string }>> {
  const guard = await requirePlatformPermission(PLATFORM_PERMISSIONS.REFUND_APPROVE);
  const denied = ensureAllowed(guard);
  if (denied) return denied;
  const actor = (guard as Extract<AuthorizationDecision, { status: "ALLOW" }>).actor;
  if (!input.reason?.trim()) return err("REASON_REQUIRED");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({ where: { id: input.refundId } });
      if (!refund) throw new Error("NOT_FOUND");
      if (refund.requestedByUserId && refund.requestedByUserId === actor.userId) {
        throw new Error("SELF_APPROVAL");
      }
      // Only move from review/request states to approved in this guard action
      if (!["REQUESTED", "UNDER_REVIEW"].includes(refund.status)) {
        throw new Error("INVALID_STATE");
      }
      const updated = await tx.refund.update({
        where: { id: input.refundId },
        data: {
          status: "APPROVED",
          approvedByUserId: actor.userId,
          approvedAt: new Date(),
        },
      });
      await auditInTx(tx, {
        actorUserId: actor.userId,
        actorScope: "platform",
        action: AUDIT_ACTIONS.REFUND_APPROVE,
        entityType: "Refund",
        entityId: updated.id,
        reason: input.reason,
        before: { status: refund.status, requestedByUserId: refund.requestedByUserId },
        after: { status: updated.status, approvedByUserId: actor.userId },
      });
      return updated;
    });
    return ok({ refundId: result.id, status: result.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NOT_FOUND")) return err("NOT_FOUND");
    if (msg.includes("SELF_APPROVAL")) return err("SELF_APPROVAL");
    if (msg.includes("INVALID_STATE")) return err("INVALID_STATE");
    throw e;
  }
}

export async function approvePayoutBatch(input: {
  payoutBatchId: string;
  reason: string;
}): Promise<ActionResult<{ payoutBatchId: string; status: string }>> {
  const guard = await requirePlatformPermission(PLATFORM_PERMISSIONS.PAYOUT_APPROVE);
  const denied = ensureAllowed(guard);
  if (denied) return denied;
  const actor = (guard as Extract<AuthorizationDecision, { status: "ALLOW" }>).actor;
  if (!input.reason?.trim()) return err("REASON_REQUIRED");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.payoutBatch.findUnique({ where: { id: input.payoutBatchId } });
      if (!batch) throw new Error("NOT_FOUND");
      if (!["DRAFT", "PENDING_APPROVAL"].includes(batch.status)) {
        throw new Error("INVALID_STATE");
      }
      // Approver cannot change destination (spec AC-9 / action contract). This action only approves status/reason.
      const updated = await tx.payoutBatch.update({
        where: { id: input.payoutBatchId },
        data: {
          status: "APPROVED",
          approvedByUserId: actor.userId,
          approvedAt: new Date(),
          approvalReason: input.reason,
          // destinationRef intentionally untouched
        },
      });
      await auditInTx(tx, {
        actorUserId: actor.userId,
        actorScope: "platform",
        action: AUDIT_ACTIONS.PAYOUT_APPROVE,
        entityType: "PayoutBatch",
        entityId: updated.id,
        reason: input.reason,
        before: { status: batch.status, destinationRef: batch.destinationRef },
        after: { status: updated.status, destinationRef: updated.destinationRef },
      });
      return updated;
    });
    return ok({ payoutBatchId: result.id, status: result.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NOT_FOUND")) return err("NOT_FOUND");
    if (msg.includes("INVALID_STATE")) return err("INVALID_STATE");
    throw e;
  }
}
