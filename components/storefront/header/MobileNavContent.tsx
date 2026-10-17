import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  HeartIcon,
  PackageSearchIcon,
  ShoppingBagIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import AccountArea, { AccountAreaSkeleton } from "./AccountArea";
import LocaleSwitcher from "./LocaleSwitcher";
import type { MenuCategory } from "@/lib/catalog/menu.types";
import type { Locale } from "@/lib/i18n/routing";

type MobileNavContentProps = {
  locale: Locale;
  categories: MenuCategory[];
};

type DrawerLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function DrawerLink({ href, label, icon: Icon }: DrawerLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      <span>{label}</span>
    </Link>
  );
}

/**
 * Drawer body — a Server Component rendered into the client shell.
 * Categories reuse the same data as the desktop mega menu.
 */
export default async function MobileNavContent({
  locale,
  categories,
}: MobileNavContentProps) {
  const t = await getTranslations("Header");

  return (
    <div className="space-y-5 pt-4">
      <section>
        <h2 className="sr-only">{t("language")}</h2>
        <LocaleSwitcher
          locale={locale}
          labels={{ en: t("localeEn"), bn: t("localeBn") }}
        />
      </section>

      <section aria-label={t("account")} className="flex flex-col gap-0.5">
        <DrawerLink
          href={`/${locale}/order/track`}
          label={t("trackOrder")}
          icon={PackageSearchIcon}
        />
        <DrawerLink
          href={`/${locale}/wishlist`}
          label={t("wishlist")}
          icon={HeartIcon}
        />
        <DrawerLink
          href={`/${locale}/cart`}
          label={t("cart")}
          icon={ShoppingBagIcon}
        />
        <Suspense fallback={<AccountAreaSkeleton />}>
          <AccountArea locale={locale} />
        </Suspense>
      </section>

      <Separator />

      <section>
        <h2 className="mb-1 px-2 text-sm font-semibold">{t("allCategories")}</h2>
        <Accordion>
          {categories.map((category) => (
            <AccordionItem key={category.id}>
              <AccordionTrigger className="py-3">
                {category.label[locale]}
              </AccordionTrigger>
              {/* Escape hatch: shadcn's accordion underlines every link, which
                  reads poorly in a nav list. Important flag overrides it. */}
              <AccordionContent className="[&_a]:no-underline! pb-3">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href={`/${locale}${category.href}`}
                      className="inline-flex items-center gap-1 font-medium text-foreground"
                    >
                      {t("shopAll")}
                    </Link>
                  </li>
                  {category.columns?.flatMap((column) =>
                    column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={`/${locale}${link.href}`}
                          className="text-muted-foreground"
                        >
                          {link.label[locale]}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
