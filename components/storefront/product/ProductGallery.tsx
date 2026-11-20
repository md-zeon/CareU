"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { ProductGalleryItem } from "@/lib/mock/pdp";
import { pickText } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

export function ProductGallery({
  items,
  locale,
  label,
  viewImageLabel,
}: {
  items: ProductGalleryItem[];
  locale: Locale;
  label: string;
  viewImageLabel: string;
}) {
  const safeItems = items.length > 0 ? items : [];
  const [active, setActive] = useState(0);
  const current = safeItems[Math.min(active, Math.max(0, safeItems.length - 1))];

  if (!current) return null;

  return (
    <div className="space-y-3" aria-label={label}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
        <Image
          src={current.src}
          alt={pickText(current.alt, locale)}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {safeItems.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {safeItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                idx === active ? "ring-2 ring-primary" : "hover:border-foreground/20",
              )}
              aria-label={viewImageLabel.replace("{index}", String(idx + 1))}
              aria-pressed={idx === active}
            >
              <Image src={item.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
