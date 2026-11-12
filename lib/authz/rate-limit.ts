import { prisma } from "../prisma.ts";

export type RateLimitRule = {
  windowMs: number;
  max: number;
};

export async function consumeAuthzRateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = Date.now();
  const windowStart = now - rule.windowMs;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });
    if (!existing) {
      await tx.rateLimit.create({
        data: { id: `authz_${key}_${now}`, key, count: 1, lastRequest: BigInt(now) },
      });
      return { allowed: true as const };
    }

    const last = Number(existing.lastRequest);
    if (last < windowStart) {
      await tx.rateLimit.update({
        where: { key },
        data: { count: 1, lastRequest: BigInt(now) },
      });
      return { allowed: true as const };
    }

    if (existing.count >= rule.max) {
      return { allowed: false as const, retryAfterMs: rule.windowMs - (now - last) };
    }

    await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 }, lastRequest: BigInt(now) },
    });
    return { allowed: true as const };
  });

  return result;
}

export const AUTHZ_RATE_LIMITS = {
  // Spec requires rate limiting beyond Better Auth defaults for role management actions.
  roleMutation: { windowMs: 60_000, max: 20 } satisfies RateLimitRule,
  bootstrap: { windowMs: 60 * 60_000, max: 10 } satisfies RateLimitRule,
} as const;

export function authzRateLimitKey(kind: string, actorOrSubject: string): string {
  return `authz:${kind}:${actorOrSubject}`;
}