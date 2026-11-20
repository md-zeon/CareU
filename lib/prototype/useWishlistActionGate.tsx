"use client";

/** Prototype-only sign in gate reused by wishlist actions and checkout. */

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prototypePersonaOptions } from "./config";
import { usePrototypeSession } from "./session";

type GateOptions = {
  suggestedPersonaId?: string;
};

function labelFor(locale: string, value: { en: string; bn: string }) {
  return locale === "bn" ? value.bn : value.en;
}

/**
 * Returns a `run` wrapper: pass any action to it and the gate decides whether
 * to run it immediately or show the shared prototype sign in panel.
 */
export function useWishlistActionGate({ suggestedPersonaId = "customer" }: GateOptions = {}) {
  const locale = useLocale();
  const t = useTranslations("PrototypeAccess");
  const { activePersona, setActivePersona, openPanel } = usePrototypeSession();
  const [open, setOpen] = useState(false);

  const allowed = activePersona.kind === "customer" && activePersona.journeyScope === "customer";

  const run = useCallback(
    (action: () => void) => {
      if (allowed) {
        action();
        return;
      }
      setOpen(true);
    },
    [allowed],
  );

  const gate: ReactNode = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("signInRequiredTitle")}
        className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[11px] font-medium">
            <LockKeyholeIcon className="size-3" aria-hidden="true" />
            {t("requiresSignIn")}
          </p>
          <h2 className="text-lg font-semibold">{t("signInRequiredTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("signInRequiredMessage")}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium">{t("continueAs")}</p>
          {prototypePersonaOptions
            .filter((persona) => persona.id === suggestedPersonaId)
            .map((persona) => (
              <Button
                key={persona.id}
                type="button"
                className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
                onClick={() => {
                  setActivePersona(persona.id);
                  setOpen(false);
                }}
              >
                <span className="block">
                  <span className="block text-sm font-medium">{labelFor(locale, persona.label)}</span>
                  <span className="block text-xs font-normal opacity-90">{labelFor(locale, persona.description)}</span>
                </span>
              </Button>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPanel}>
            {t("open")}
          </Button>
          <Link
            href={`/${locale}/login`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            {t("goToLogin")}
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("stayGuest")}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { allowed, run, gate };
}
