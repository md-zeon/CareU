import 'server-only';

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
} | null;

/**
 * Placeholder for Better Auth integration. Returns null for unauthenticated state.
 * This keeps the header's Suspense boundary stable so we can wire auth later without
 * changing component structure.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return null;
}
