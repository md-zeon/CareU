"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { Locale } from "@/lib/i18n/routing";

type LocaleSwitcherProps = {
  locale: Locale;
  labels: Record<"en" | "bn", string>;
  className?: string;
};

/**
 * EN / বাং segmented toggle.
 *
 * Built on plain next/navigation + next/link (no next-intl client context),
 * so it needs no Intl provider on the client and stays hydration-light.
 * The current path is preserved when switching locales.
 */
export default function LocaleSwitcher({
  locale,
  labels,
  className,
}: LocaleSwitcherProps) {
  const pathname = usePathname();

  // next-intl serves URLs with an always-present locale prefix (/en/…, /bn/…).
  const prefix = `/${locale}`;
  const isOnCurrentLocale = pathname === prefix || pathname.startsWith(`${prefix}/`);

  /** Same page, expressed in the target locale. */
  const hrefFor = (target: Locale) => {
    if (!isOnCurrentLocale) return `/${target}`;
    const rest = pathname.slice(prefix.length); // "" or "/search/…"
    return `/${target}${rest}` || `/${target}`;
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "items-center gap-0.5 rounded-full border bg-muted p-0.5 text-xs font-medium",
        "flex",
        className
      )}
    >
      {(["en", "bn"] as const).map((target) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            href={hrefFor(target)}
            hrefLang={target}
            aria-current={active ? "true" : undefined}
            lang={target === "bn" ? "bn" : "en"}
            className={cn(
              "rounded-full px-2.5 py-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {labels[target]}
          </Link>
        );
      })}
    </div>
  );
}
