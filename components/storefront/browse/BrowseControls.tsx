"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrowseSortKey, FacetDefinition } from "@/lib/mock/browse";
import type { Locale } from "@/lib/i18n/routing";
import { pickText } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

type Labels = {
  filters: string;
  sortBy: string;
  activeFilters: string;
  clearAll: string;
  applyFilters: string;
  showResults: string;
  resetFilters: string;
  minPrice: string;
  maxPrice: string;
  priceRange: string;
  resultsCount: string;
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BrowseControls({
  locale,
  facets,
  sortOptions,
  activeSort,
  labels,
  totalCount,
}: {
  locale: Locale;
  facets: FacetDefinition[];
  sortOptions: { key: BrowseSortKey; label: { en: string; bn: string } }[];
  activeSort: BrowseSortKey;
  labels: Labels;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const sp = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function updateParams(mutator: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutator(next);
    next.delete("page");
    startTransition(() => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function setSort(sort: string) {
    updateParams((next) => {
      if (sort) next.set("sort", sort);
      else next.delete("sort");
    });
  }

  function clearAll() {
    updateParams((next) => {
      const q = next.get("q");
      next.forEach((_v, k) => next.delete(k));
      if (q) next.set("q", q);
    });
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  for (const facet of facets) {
    if (!facet.visible) continue;
    if (facet.kind === "range" && facet.key === "price") {
      const min = sp.get("minPrice");
      const max = sp.get("maxPrice");
      if (min) activeChips.push({ key: "minPrice", label: `${labels.minPrice}: ${min}`, onRemove: () => updateParams((n) => n.delete("minPrice")) });
      if (max) activeChips.push({ key: "maxPrice", label: `${labels.maxPrice}: ${max}`, onRemove: () => updateParams((n) => n.delete("maxPrice")) });
      continue;
    }
    const paramKey = facet.key.startsWith("attr_") ? facet.key : facet.key;
    const current = (sp.get(paramKey) ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    if (paramKey === "rating") {
      const r = sp.get("rating");
      if (r) {
        const opt = facet.options?.find((o) => o.value === r);
        activeChips.push({
          key: "rating",
          label: opt ? pickText(opt.label, locale) : r,
          onRemove: () => updateParams((n) => n.delete("rating")),
        });
      }
      continue;
    }
    for (const val of current) {
      const opt = facet.options?.find((o) => o.value === val);
      activeChips.push({
        key: `${paramKey}-${val}`,
        label: opt ? pickText(opt.label, locale) : val,
        onRemove: () => updateParams((n) => {
          const vals = (n.get(paramKey) ?? "").split(",").map((v) => v.trim()).filter(Boolean).filter((v) => v !== val);
          if (vals.length) n.set(paramKey, vals.join(","));
          else n.delete(paramKey);
        }),
      });
    }
  }

  function renderFacet(facet: FacetDefinition) {
    if (!facet.visible) return null;
    if (facet.kind === "range" && facet.key === "price") {
      const minVal = sp.get("minPrice") ?? "";
      const maxVal = sp.get("maxPrice") ?? "";
      return (
        <div key={facet.key} className="space-y-2">
          <p className="text-sm font-medium">{pickText(facet.label, locale)}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={labels.minPrice}
              defaultValue={minVal}
              onBlur={(e) => updateParams((n) => {
                const v = e.target.value.trim();
                if (v) n.set("minPrice", v); else n.delete("minPrice");
              })}
              aria-label={labels.minPrice}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={labels.maxPrice}
              defaultValue={maxVal}
              onBlur={(e) => updateParams((n) => {
                const v = e.target.value.trim();
                if (v) n.set("maxPrice", v); else n.delete("maxPrice");
              })}
              aria-label={labels.maxPrice}
            />
          </div>
        </div>
      );
    }
    if (facet.kind === "single" && facet.key === "rating") {
      const current = sp.get("rating") ?? "";
      return (
        <fieldset key={facet.key} className="space-y-2">
          <legend className="text-sm font-medium">{pickText(facet.label, locale)}</legend>
          <div className="space-y-1.5">
            {facet.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="rating"
                  checked={current === opt.value}
                  onChange={() => updateParams((n) => n.set("rating", opt.value))}
                />
                <span>{pickText(opt.label, locale)}</span>
                {typeof opt.count === "number" ? <span className="text-muted-foreground">({opt.count})</span> : null}
              </label>
            ))}
            {current ? (
              <button type="button" className="text-xs text-muted-foreground underline" onClick={() => updateParams((n) => n.delete("rating"))}>
                {labels.resetFilters}
              </button>
            ) : null}
          </div>
        </fieldset>
      );
    }
    const paramKey = facet.key;
    const current = (sp.get(paramKey) ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    return (
      <fieldset key={facet.key} className="space-y-2">
        <legend className="text-sm font-medium">{pickText(facet.label, locale)}</legend>
        <div className="space-y-1.5">
          {facet.options?.map((opt) => {
            const checked = current.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => updateParams((n) => {
                    const vals = toggleValue((n.get(paramKey) ?? "").split(",").map((v) => v.trim()).filter(Boolean), opt.value);
                    if (vals.length) n.set(paramKey, vals.join(",")); else n.delete(paramKey);
                  })}
                />
                <span>{pickText(opt.label, locale)}</span>
                {typeof opt.count === "number" ? <span className="text-muted-foreground">({opt.count})</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  const panel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{labels.filters}</h2>
        {activeChips.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>{labels.clearAll}</Button>
        ) : null}
      </div>
      {facets.filter((f) => f.visible).map(renderFacet)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
            <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
            {labels.filters}
          </Button>
          <p className="text-sm text-muted-foreground">{labels.resultsCount.replace("{count}", String(totalCount))}</p>
          {isPending ? <span className="text-xs text-muted-foreground">…</span> : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{labels.sortBy}</span>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={activeSort}
            onChange={(e) => setSort(e.target.value)}
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{pickText(opt.label, locale)}</option>
            ))}
          </select>
        </label>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{labels.activeFilters}:</span>
          {activeChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button type="button" className="ml-1 rounded-sm p-0.5 hover:bg-muted" aria-label={`${labels.clearAll}: ${chip.label}`} onClick={chip.onRemove}>
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className={cn("lg:hidden", open ? "block" : "hidden")}>
        <div className="rounded-2xl border bg-card p-4">{panel}</div>
      </div>
    </div>
  );
}

export function BrowseFiltersSidebar(_props: {
  locale: Locale;
  facets: FacetDefinition[];
  sortOptions: { key: BrowseSortKey; label: { en: string; bn: string } }[];
  activeSort: BrowseSortKey;
  labels: Labels;
  totalCount: number;
}) {
  void _props;
  // Sidebar renders the same controls panel on desktop via BrowseControls? We'll use BrowseControls for chips/sort/mobile and duplicate panel for desktop.
  // To keep simple, provide a desktop-only wrapper in page using a separate panel component would be better, but for now this is unused.
  return null;
}
