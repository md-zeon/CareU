"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prototypeJourneyShortcuts, prototypePersonaOptions } from "@/lib/prototype/config";
import { usePrototypeSession } from "@/lib/prototype/session";
import type { PrototypeShortcutArea } from "@/lib/prototype/types";
import { ChevronDown, ChevronUp, FlaskConical, Route, UserRound, X } from "lucide-react";

function labelFor(locale: string, value: { en: string; bn: string }) {
  return locale === "bn" ? value.bn : value.en;
}

const areaOrder: PrototypeShortcutArea[] = ["general", "customer", "seller", "platform"];

export function PrototypeAccessSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("PrototypeAccess");
  const { session, activePersona, setActivePersona, togglePanel, closePanel } = usePrototypeSession();
  const [showShortcuts, setShowShortcuts] = useState(true);

  const grouped = useMemo(() => {
    return areaOrder.map((area) => ({
      area,
      items: prototypeJourneyShortcuts.filter((s) => s.area === area),
    }));
  }, []);

  const areaLabel = (area: PrototypeShortcutArea) => {
    if (area === "general") return t("areaGeneral");
    if (area === "customer") return t("areaCustomer");
    if (area === "seller") return t("areaSeller");
    return t("areaPlatform");
  };

  const hrefFor = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`);
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {session.isPanelOpen ? (
        <section
          aria-label={t("title")}
          className="max-h-[min(80vh,44rem)] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/90"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FlaskConical className="size-3.5" aria-hidden="true" />
                  {t("badge")}
                </Badge>
                <span className="text-xs text-muted-foreground">{t("title")}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("description")}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={closePanel} aria-label={t("close")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("currentPersona")}</p>
              <div className="mt-1 flex items-start gap-2">
                <UserRound className="mt-0.5 size-4 text-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug">{labelFor(locale, activePersona.label)}</p>
                  <p className="text-xs text-muted-foreground">{labelFor(locale, activePersona.description)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("personas")}</p>
              <div className="grid gap-1.5">
                {prototypePersonaOptions.map((persona) => {
                  const active = persona.id === activePersona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setActivePersona(persona.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                      aria-pressed={active}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{labelFor(locale, persona.label)}</span>
                        {active ? <Badge variant="outline">{t("panelOpen")}</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{labelFor(locale, persona.description)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between rounded-md text-left text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setShowShortcuts((v) => !v)}
                aria-expanded={showShortcuts}
              >
                <span className="inline-flex items-center gap-1.5"><Route className="size-3.5" aria-hidden="true" />{t("shortcuts")}</span>
                {showShortcuts ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
              </button>
              {showShortcuts ? (
                <div className="space-y-3">
                  {grouped.map((group) => (
                    <div key={group.area}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{areaLabel(group.area)}</p>
                      <ul className="grid gap-1">
                        {group.items.map((item) => {
                          const current = pathWithoutLocale === item.href;
                          return (
                            <li key={item.id}>
                              <Link
                                href={hrefFor(item.href)}
                                className={cn(
                                  "flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                  current ? "border-primary/30 bg-primary/5" : "border-border",
                                )}
                                onClick={() => {
                                  if (item.suggestedPersonaId) setActivePersona(item.suggestedPersonaId);
                                }}
                              >
                                <span className="min-w-0">
                                  <span className="block font-medium leading-snug">{labelFor(locale, item.label)}</span>
                                  <span className="mt-0.5 flex flex-wrap gap-1">
                                    {item.status === "planned" ? <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{t("planned")}</Badge> : null}
                                    {item.requiresSignIn ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{t("requiresSignIn")}</Badge> : null}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <Button
        type="button"
        onClick={togglePanel}
        className="rounded-full shadow-lg"
        size="lg"
        aria-expanded={session.isPanelOpen}
        aria-label={session.isPanelOpen ? t("close") : t("open")}
      >
        <FlaskConical className="size-4" aria-hidden="true" />
        <span>{t("badge")}</span>
        <span className="hidden text-xs font-normal opacity-90 sm:inline">{labelFor(locale, activePersona.label)}</span>
      </Button>
    </div>
  );
}
