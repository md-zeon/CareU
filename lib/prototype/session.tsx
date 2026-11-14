"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultPrototypeSession, getPrototypePersonaById, prototypePersonaOptions } from "./config";
import { readPrototypeSession, writePrototypeSession } from "./storage";
import type { PrototypePersonaOption, PrototypeSession } from "./types";

type PrototypeSessionContextValue = {
  session: PrototypeSession;
  activePersona: PrototypePersonaOption;
  setActivePersona: (id: string) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
};

const PrototypeSessionContext = createContext<PrototypeSessionContextValue | null>(null);

function normalizeSession(session: PrototypeSession): PrototypeSession {
  if (!getPrototypePersonaById(session.activePersonaId)) return defaultPrototypeSession;
  return session;
}

export function PrototypeSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PrototypeSession>(defaultPrototypeSession);

  useEffect(() => {
    // Sync persisted prototype session after mount to avoid server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(normalizeSession(readPrototypeSession()));
  }, []);

  const updateSession = useCallback((updater: (prev: PrototypeSession) => PrototypeSession) => {
    setSession((prev) => {
      const next = normalizeSession(updater(prev));
      writePrototypeSession(next);
      return next;
    });
  }, []);

  const setActivePersona = useCallback(
    (id: string) => {
      if (!getPrototypePersonaById(id)) return;
      updateSession((prev) => ({ ...prev, activePersonaId: id }));
    },
    [updateSession],
  );

  const togglePanel = useCallback(() => updateSession((prev) => ({ ...prev, isPanelOpen: !prev.isPanelOpen })), [updateSession]);
  const openPanel = useCallback(() => updateSession((prev) => ({ ...prev, isPanelOpen: true })), [updateSession]);
  const closePanel = useCallback(() => updateSession((prev) => ({ ...prev, isPanelOpen: false })), [updateSession]);

  const activePersona = useMemo(
    () => getPrototypePersonaById(session.activePersonaId) ?? prototypePersonaOptions[0],
    [session.activePersonaId],
  );

  const value = useMemo(
    () => ({ session, activePersona, setActivePersona, togglePanel, openPanel, closePanel }),
    [session, activePersona, setActivePersona, togglePanel, openPanel, closePanel],
  );

  return <PrototypeSessionContext.Provider value={value}>{children}</PrototypeSessionContext.Provider>;
}

export function usePrototypeSession(): PrototypeSessionContextValue {
  const ctx = useContext(PrototypeSessionContext);
  if (!ctx) {
    throw new Error("usePrototypeSession must be used within PrototypeSessionProvider");
  }
  return ctx;
}
