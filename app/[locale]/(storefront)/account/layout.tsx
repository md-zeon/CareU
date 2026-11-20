import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { AccountShell } from "@/components/storefront/account/AccountShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Every account screen sits behind the customer-only prototype gate. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <AccountShell>{children}</AccountShell>
    </ProtectedPrototypePage>
  );
}
