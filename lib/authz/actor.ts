import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "../auth.ts";
import { prisma } from "../prisma.ts";
import type { ActorContext } from "./decision.ts";
import type { PlatformRoleKey } from "./roles.ts";

export const getActor = cache(async (): Promise<ActorContext | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user?.id) return null;

  const [assignments, dbUser] = await Promise.all([
    prisma.platformRoleAssignment.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { role: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, phoneNumberVerified: true },
    }),
  ]);

  const platformRoles = assignments.map((a) => a.role as PlatformRoleKey);
  const verifiedContact = Boolean(
    dbUser?.emailVerified || dbUser?.phoneNumberVerified,
  );

  return {
    userId: user.id,
    platformRoles,
    verifiedContact,
  };
});

export function hasVerifiedContactForPlatform(actor: ActorContext): boolean {
  return actor.verifiedContact || actor.platformRoles.length === 0;
}
