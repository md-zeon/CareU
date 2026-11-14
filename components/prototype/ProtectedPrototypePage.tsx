"use client";

import type { ReactNode } from "react";
import { PrototypeGate } from "./PrototypeGate";
import type { PrototypeJourneyScope } from "@/lib/prototype/types";

export function ProtectedPrototypePage({
  children,
  allowedScopes,
  suggestedPersonaId,
}: {
  children: ReactNode;
  allowedScopes?: PrototypeJourneyScope[];
  suggestedPersonaId?: string;
}) {
  return (
    <PrototypeGate requiresSignIn allowedScopes={allowedScopes} suggestedPersonaId={suggestedPersonaId}>
      {children}
    </PrototypeGate>
  );
}
