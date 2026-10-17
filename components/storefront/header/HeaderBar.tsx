import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AccountArea, { AccountAreaSkeleton } from "./AccountArea";
import CartButton from "./CartButton";
import HeaderLogo from "./HeaderLogo";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileNav from "./MobileNav";
import MobileNavContent from "./MobileNavContent";
import SearchBar from "./SearchBar";
import TrackOrderLink from "./TrackOrderLink";
import WishlistButton from "./WishlistButton";
import type { MenuCategory } from "@/lib/catalog/menu.types";
import type { Locale } from "@/lib/i18n/routing";

type HeaderBarProps = {
  locale: Locale;
  categories: MenuCategory[];
};

/**
 * Main header row (logo · search · actions).
 *
 * Desktop: single row with centered search.
 * Mobile: icon row + full-width search row underneath; hamburger, locale,
 * account and track-order live in the drawer (see MobileNavContent).
 */
export default async function HeaderBar({
  locale,
  categories,
}: HeaderBarProps) {
  const t = await getTranslations("Header");

  return (
    <div className="border-b bg-background lg:border-b-0">
      <div className="mx-auto flex h-16 max-w-360 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <MobileNav
          menuLabel={t("menu")}
          closeLabel={t("closeMenu")}
          title={t("brand")}
        >
          <MobileNavContent locale={locale} categories={categories} />
        </MobileNav>

        <HeaderLogo locale={locale} brand={t("brand")} />

        {/* Desktop search — hidden from the layout on small screens */}
        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <div className="w-full max-w-2xl">
            <SearchBar locale={locale} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher
            locale={locale}
            labels={{ en: t("localeEn"), bn: t("localeBn") }}
            className="hidden lg:flex"
          />
          <TrackOrderLink locale={locale} className="hidden md:inline-flex" />
          <div className="hidden sm:block">
            <Suspense fallback={<AccountAreaSkeleton />}>
              <AccountArea locale={locale} />
            </Suspense>
          </div>
          <WishlistButton href={`/${locale}/wishlist`} label={t("wishlist")} />
          <CartButton href={`/${locale}/cart`} label={t("cart")} />
        </div>
      </div>

      {/* Mobile search row */}
      <div className="px-4 pb-3 lg:hidden">
        <SearchBar locale={locale} />
      </div>
    </div>
  );
}
