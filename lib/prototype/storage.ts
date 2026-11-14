import {
  PROTOTYPE_SESSION_STORAGE_KEY,
  PROTOTYPE_SESSION_VERSION,
  defaultPrototypeSession,
  getPrototypePersonaById,
} from "./config";
import type { PrototypeSession } from "./types";

function isValidSession(value: unknown): value is PrototypeSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.version !== PROTOTYPE_SESSION_VERSION) return false;
  if (typeof v.activePersonaId !== "string") return false;
  if (typeof v.isPanelOpen !== "boolean") return false;
  return Boolean(getPrototypePersonaById(v.activePersonaId));
}

export function readPrototypeSession(): PrototypeSession {
  if (typeof window === "undefined") return defaultPrototypeSession;
  try {
    const raw = window.localStorage.getItem(PROTOTYPE_SESSION_STORAGE_KEY);
    if (!raw) return defaultPrototypeSession;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSession(parsed)) return defaultPrototypeSession;
    return parsed;
  } catch {
    return defaultPrototypeSession;
  }
}

export function writePrototypeSession(session: PrototypeSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROTOTYPE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // best effort only
  }
}
