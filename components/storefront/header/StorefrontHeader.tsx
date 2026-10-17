import { locale as getRootLocale } from "next/root-params";
import AnnouncementBar from "./AnnouncementBar";
import CategoryNav from "./CategoryNav";
import HeaderBar from "./HeaderBar";
import { getMenu } from "@/lib/catalog/menu";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Storefront header — server-rendered.
 *
 * Structure:
 *  1. Announcement bar (scrolls away)
 *  2. Sticky row: main header + desktop category nav
 *
 * The sticky wrapper is a sibling of the announcement bar (not its parent) so
 * it can stick for the whole page — CSS sticky is bounded by its parent box.
 * All data reads (`getMenu`) are cached, so the whole header prerenders into
 * the static shell.
 */
export default async function StorefrontHeader() {
  const rawLocale = await getRootLocale();
  const locale: Locale = rawLocale === "bn" ? "bn" : "en";
  const categories = await getMenu();

  return (
    <>
      <AnnouncementBar locale={locale} />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <HeaderBar locale={locale} categories={categories} />
        <CategoryNav locale={locale} categories={categories} />
      </header>
    </>
  );
}
