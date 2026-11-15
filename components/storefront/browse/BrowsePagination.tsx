import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { withLocale } from "@/components/storefront/home/home-utils";

function buildHref(basePath: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function BrowsePagination({
  locale,
  basePath,
  searchParams,
  page,
  pageCount,
  labels,
}: {
  locale: Locale;
  basePath: string;
  searchParams: URLSearchParams;
  page: number;
  pageCount: number;
  labels: { previous: string; next: string; pageOf: string };
}) {
  if (pageCount <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  const pageLabel = labels.pageOf.replace("{page}", String(page)).replace("{total}", String(pageCount));

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={pageLabel}>
      <p className="text-sm text-muted-foreground">{pageLabel}</p>
      <div className="flex items-center gap-2">
        <Link
          href={withLocale(locale, buildHref(basePath, searchParams, prev))}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          {labels.previous}
        </Link>
        <Link
          href={withLocale(locale, buildHref(basePath, searchParams, next))}
          aria-disabled={page >= pageCount}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= pageCount && "pointer-events-none opacity-50",
          )}
        >
          {labels.next}
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
