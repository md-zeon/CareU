"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { CrossSellGroup } from "@/lib/mock/pdp";
import { getRecentlyViewedItems } from "@/lib/mock/pdp";
import { pickText } from "@/components/storefront/home/home-utils";
import { Section } from "@/components/storefront/primitives";
import { ProductCrossSellCard } from "./ProductCrossSellCard";

const STORAGE_KEY = "careu-prototype-recently-viewed";
const MAX_STORED = 8;

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_STORED)));
  } catch {
    // ignore prototype storage failures
  }
}

export function RecentlyViewedSection({
  locale,
  currentProductId,
  fallbackGroup,
  shopLabels,
  prototypeNote,
}: {
  locale: Locale;
  currentProductId: string;
  fallbackGroup: CrossSellGroup;
  shopLabels: { careu: string; seller: string };
  prototypeNote: string;
}) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const existing = readIds().filter((id) => id !== currentProductId);
    const next = [currentProductId, ...existing].slice(0, MAX_STORED);
    writeIds(next);
    const timer = window.setTimeout(() => {
      setIds(existing.slice(0, 4));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentProductId]);

  const items = useMemo(() => {
    const fromStorage = ids.length > 0 ? getRecentlyViewedItems(ids, currentProductId, 4) : [];
    if (fromStorage.length > 0) return fromStorage;
    return fallbackGroup.items;
  }, [ids, currentProductId, fallbackGroup.items]);

  const isFallback = ids.length === 0 || getRecentlyViewedItems(ids, currentProductId, 4).length === 0;

  if (items.length === 0) return null;

  return (
    <Section
      title={pickText(fallbackGroup.title, locale)}
      description={isFallback ? prototypeNote : undefined}
      contentClassName="space-y-0"
    >
      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {items.map((item) => (
          <ProductCrossSellCard key={item.productId} item={item} locale={locale} shopLabels={shopLabels} />
        ))}
      </ul>
    </Section>
  );
}
