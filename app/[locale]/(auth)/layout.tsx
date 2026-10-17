import type { ReactNode } from "react";

/**
 * Auth route group — intentionally minimal chrome (no storefront
 * header/footer) so sign-in stays fast and focused.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
      {children}
    </main>
  );
}
