import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronDownIcon } from "lucide-react";
import MegaMenu from "./MegaMenu";
import type { MenuCategory } from "@/lib/catalog/menu.types";
import type { Locale } from "@/lib/i18n/routing";

type CategoryNavProps = {
  locale: Locale;
  categories: MenuCategory[];
};

/**
 * Desktop category bar with CSS-only mega menus (hover + keyboard focus).
 *
 * - All links are server-rendered into the initial HTML (SEO + instant).
 * - Panels are `visibility: hidden` until hover / focus-within, so their
 *   links are not tab stops while closed.
 * - Panels render full-viewport-width (nav is the positioned ancestor) and
 *   sit directly under the bar, so the pointer never leaves an open panel.
 * - Mobile gets the same categories via the nav drawer instead.
 */
export default async function CategoryNav({
  locale,
  categories,
}: CategoryNavProps) {
  const t = await getTranslations("Header");

  return (
    <nav
      aria-label={t("navigation")}
      className="relative hidden border-t bg-background lg:block"
    >
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <ul className="flex items-stretch gap-1">
          {categories.map((category) => (
            <li key={category.id} className="group/nav static">
              <Link
                href={`/${locale}${category.href}`}
                className="flex h-full items-center gap-1 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 group-hover/nav:bg-muted group-focus-within/nav:bg-muted"
              >
                {category.label[locale]}
                {category.columns && (
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                )}
              </Link>

              {/* Closed panels keep their layout box but skip rendering, so the
                  lazy product images inside are never fetched until the panel
                  is opened. `visibility` alone would still load them. */}
              {category.columns && (
                <div className="invisible absolute inset-x-0 top-full z-50 opacity-0 transition-opacity duration-150 [content-visibility:hidden] group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:[content-visibility:visible] group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-focus-within/nav:[content-visibility:visible]">
                  <MegaMenu category={category} locale={locale} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
