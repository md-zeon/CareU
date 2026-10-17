import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";

/** Fallback shown only if the translation file has no announcement items. */
const FALLBACK_ITEMS: AnnouncementItem[] = [
  { text: "Free delivery on orders over ৳999" },
  { text: "Cash on delivery available nationwide" },
];

/** Seconds each message stays on screen. */
const SECONDS_PER_MESSAGE = 5;

type AnnouncementItem = {
  text: string;
  /** Internal path ("/order/track") or absolute URL. Omit for plain text. */
  href?: string;
};

type AnnouncementBarProps = {
  locale: Locale;
};

/**
 * Accepts `["plain string", { "text": "…", "href": "…" }, …]` from the
 * message catalog, so entries can be plain text or deep links.
 */
function parseItems(raw: unknown): AnnouncementItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap<AnnouncementItem>((entry) => {
    if (typeof entry === "string" && entry.length > 0) {
      return [{ text: entry }];
    }
    if (entry && typeof entry === "object" && "text" in entry) {
      const item = entry as { text?: unknown; href?: unknown };
      if (typeof item.text === "string" && item.text.length > 0) {
        return [
          {
            text: item.text,
            href:
              typeof item.href === "string" && item.href.length > 0
                ? item.href
                : undefined,
          },
        ];
      }
    }
    return [];
  });
}

/** Locale-aware href for internal paths; external URLs pass through. */
function resolveHref(href: string, locale: Locale): string {
  if (/^https?:\/\//.test(href)) return href;
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

/**
 * Announcement bar — zero JS.
 *
 * Messages are stacked vertically inside a one-line viewport and slid with a
 * CSS `steps(N)` animation, so N messages rotate without hydration.
 *
 * Interactions are all CSS:
 *  - hover pauses rotation (time to read/click)
 *  - keyboard focus stops rotation and expands the full list as an overlay,
 *    so links that are normally clipped off-screen become visible/focusable
 *  - prefers-reduced-motion disables rotation
 *
 * Responsive: 40px bar, messages clamp to two lines — long EN/বাং strings
 * never clip or change the bar height.
 */
export default async function AnnouncementBar({
  locale,
}: AnnouncementBarProps) {
  const t = await getTranslations("Announcement");

  const messages = parseItems(t.raw("items"));
  const items = messages.length > 0 ? messages : FALLBACK_ITEMS;
  const rotating = items.length > 1;

  return (
    <div className="border-b bg-muted text-muted-foreground">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="announcement-viewport relative h-10 overflow-hidden">
          <div
            className={
              rotating ? "announcement-track flex flex-col" : "flex flex-col"
            }
            style={
              rotating
                ? ({
                    animation: `announcement-scroll ${
                      items.length * SECONDS_PER_MESSAGE
                    }s steps(${items.length}, end) infinite`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {items.map((item, index) => {
              const inner = (
                <span className="line-clamp-2 w-full text-balance">
                  {item.text}
                </span>
              );

              return (
                <p
                  key={`${index}-${item.text}`}
                  className="flex h-10 shrink-0 items-center justify-center px-1 text-center text-xs leading-snug transition-colors hover:bg-muted-foreground/5 sm:text-sm"
                >
                  {item.href ? (
                    <Link
                      href={resolveHref(item.href, locale)}
                      className="max-w-full rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      {...(/^https?:\/\//.test(item.href)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
