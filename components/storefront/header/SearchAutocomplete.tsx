"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { getSearchSuggestions } from "@/lib/mock/browse";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";

type Labels = {
  placeholder: string;
  label: string;
  suggestions: string;
  seeAllResults: string;
  noSuggestions: string;
  typeToSearch: string;
};

export function SearchAutocomplete({ locale, labels }: { locale: Locale; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => (query.trim().length >= 2 ? getSearchSuggestions(query, 8) : []), [query]);
  const showPanel = open && query.trim().length >= 2;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const seeAllHref = withLocale(locale, `/search?q=${encodeURIComponent(query.trim())}`);

  return (
    <div ref={rootRef} className="relative w-full">
      <form action={withLocale(locale, "/search")} method="get" role="search" className="w-full">
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!showPanel) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, suggestions.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
                setActive(-1);
              } else if (e.key === "Enter" && active >= 0 && active < suggestions.length) {
                e.preventDefault();
                window.location.href = withLocale(locale, suggestions[active].href);
              } else if (e.key === "Enter" && active === suggestions.length) {
                e.preventDefault();
                window.location.href = seeAllHref;
              }
            }}
            autoComplete="off"
            placeholder={labels.placeholder}
            aria-label={labels.label}
            aria-expanded={showPanel}
            aria-controls="header-search-suggestions"
            className="h-11 rounded-full border-transparent bg-muted pl-10 pr-28 focus-visible:border-ring focus-visible:bg-background"
          />
          <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-4">
            {labels.label}
          </Button>
        </div>
      </form>

      {showPanel ? (
        <div
          id="header-search-suggestions"
          role="listbox"
          aria-label={labels.suggestions}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border bg-popover shadow-lg"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{labels.noSuggestions}</p>
          ) : (
            <ul className="max-h-96 overflow-auto py-2">
              {suggestions.map((s, idx) => (
                <li key={`${s.kind}-${s.id}`} role="option" aria-selected={idx === active}>
                  <Link
                    href={withLocale(locale, s.href)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      idx === active && "bg-muted",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {s.image ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium uppercase text-muted-foreground">
                        {s.kind.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{pickText(s.label, locale)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {pickText(s.secondaryLabel, locale) || s.kind}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t p-2">
            <Link
              href={seeAllHref}
              className={cn(
                "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                active === suggestions.length && "bg-muted",
              )}
              onClick={() => setOpen(false)}
            >
              {labels.seeAllResults.replace("{query}", query.trim())}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
