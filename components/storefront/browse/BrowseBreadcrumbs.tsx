import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/mock/browse";
import type { Locale } from "@/lib/i18n/routing";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";

export function BrowseBreadcrumbs({
  items,
  locale,
  label,
}: {
  items: BreadcrumbItem[];
  locale: Locale;
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${idx}-${item.href ?? "current"}`} className="inline-flex items-center gap-1.5">
              {idx > 0 ? <ChevronRightIcon className="size-4" aria-hidden="true" /> : null}
              {item.href && !isLast ? (
                <Link href={withLocale(locale, item.href)} className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  {pickText(item.label, locale)}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-medium text-foreground" : undefined}>
                  {pickText(item.label, locale)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
