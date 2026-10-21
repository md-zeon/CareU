import "server-only";

import { headers } from "next/headers";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

/**
 * Session read for the storefront, following the Next.js Cache Components
 * authentication guide: a `use cache: private` scope may read headers(),
 * stays browser-only, and gets a default 5-minute lifetime so authenticated
 * UI can be prefetched. Callers must sit behind a <Suspense> boundary and
 * must never live inside a plain `use cache` scope or a layout's top level.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  "use cache: private";

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    phone: user.phoneNumber ?? undefined,
  };
}
