"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardShell, CardContent, CardHeader, PageContainer } from "@/components/storefront/primitives";
import { prototypePersonaOptions } from "@/lib/prototype/config";
import { usePrototypeSession } from "@/lib/prototype/session";
import type { PrototypeJourneyScope } from "@/lib/prototype/types";
import { LockKeyhole } from "lucide-react";

function labelFor(locale: string, value: { en: string; bn: string }) {
  return locale === "bn" ? value.bn : value.en;
}

export function PrototypeGate({
  children,
  requiresSignIn = true,
  allowedScopes,
  suggestedPersonaId,
  title,
  message,
}: {
  children: ReactNode;
  requiresSignIn?: boolean;
  allowedScopes?: PrototypeJourneyScope[];
  suggestedPersonaId?: string;
  title?: string;
  message?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("PrototypeAccess");
  const { activePersona, setActivePersona, openPanel } = usePrototypeSession();

  const allowed = !requiresSignIn
    ? true
    : activePersona.kind !== "guest" && (!allowedScopes || allowedScopes.includes(activePersona.journeyScope));

  if (allowed) return <>{children}</>;

  const candidates = prototypePersonaOptions.filter((p) => {
    if (p.kind === "guest") return false;
    if (!allowedScopes || allowedScopes.length === 0) return true;
    return allowedScopes.includes(p.journeyScope);
  });

  const ordered = suggestedPersonaId
    ? [...candidates].sort((a, b) => (a.id === suggestedPersonaId ? -1 : b.id === suggestedPersonaId ? 1 : 0))
    : candidates;

  return (
    <PageContainer className="py-10 sm:py-14">
      <CardShell className="mx-auto max-w-2xl">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              {t("badge")}
            </Badge>
            <Badge variant="outline">{t("requiresSignIn")}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title ?? t("signInRequiredTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{message ?? t("signInRequiredMessage")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">{t("continueAs")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ordered.map((persona, idx) => (
                <Button
                  key={persona.id}
                  type="button"
                  variant={idx === 0 ? "default" : "outline"}
                  className="h-auto justify-start whitespace-normal px-3 py-2 text-left"
                  onClick={() => setActivePersona(persona.id)}
                >
                  <span className="block">
                    <span className="block text-sm font-medium">{labelFor(locale, persona.label)}</span>
                    <span className="block text-xs font-normal opacity-90">{labelFor(locale, persona.description)}</span>
                    {suggestedPersonaId === persona.id ? <span className="mt-1 block text-[11px] font-medium">{t("suggestedPersona")}</span> : null}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={openPanel}>{t("open")}</Button>
            <Link
              href={`/${locale}/login`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-2.5 text-sm font-medium shadow-xs transition-all hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t("goToLogin")}
            </Link>
          </div>
        </CardContent>
      </CardShell>
    </PageContainer>
  );
}

export function PrototypeNotBuilt({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  const t = useTranslations("PrototypeAccess");
  return (
    <PageContainer className="py-10 sm:py-14">
      <CardShell className="mx-auto max-w-2xl">
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit">{t("badge")}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title ?? t("notBuiltTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{message ?? t("notBuiltMessage")}</p>
        </CardHeader>
      </CardShell>
    </PageContainer>
  );
}
