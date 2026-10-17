import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog/price";
import type { MenuCategory, MenuProduct } from "@/lib/catalog/menu.types";
import type { Locale } from "@/lib/i18n/routing";

type MegaMenuProps = {
  category: MenuCategory;
  locale: Locale;
};

type MenuProductCardProps = {
  product: MenuProduct;
  locale: Locale;
};

function MenuProductCard({ product, locale }: MenuProductCardProps) {
  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.image}
          alt={product.title[locale]}
          fill
          sizes="176px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <Badge className="absolute top-2 left-2" variant="default">
            {product.badge[locale]}
          </Badge>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
        {product.title[locale]}
      </p>
      <p className="mt-0.5 text-sm">
        <span className="font-semibold">{formatPrice(product.price, locale)}</span>
        {product.compareAtPrice != null && (
          <span className="ml-1.5 text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice, locale)}
          </span>
        )}
      </p>
    </Link>
  );
}

/**
 * Full-width mega panel for one category.
 * Pure server-rendered markup — shown/hidden by CSS on hover/focus-within
 * in CategoryNav (zero JavaScript).
 */
export default async function MegaMenu({ category, locale }: MegaMenuProps) {
  const t = await getTranslations("Header");
  const columns = category.columns ?? [];
  const products = category.products ?? [];

  return (
    <div className="border-t bg-popover shadow-lg">
      <div className="mx-auto max-w-360 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}${category.href}`}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("viewAllCategory", { category: category.label[locale] })}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
          {columns.map((column) => (
            <div key={column.title.en} className="w-48 shrink-0">
              <h3 className="mb-3 text-sm font-semibold">
                {column.title[locale]}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={`/${locale}${link.href}`}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {link.label[locale]}
                      {link.badge && (
                        <Badge variant="secondary">{link.badge[locale]}</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {products.length > 0 && (
            <section
              aria-labelledby={`mega-featured-${category.id}`}
              className="shrink-0"
            >
              <h3
                id={`mega-featured-${category.id}`}
                className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {t("featuredProducts")}
              </h3>
              <ul className="flex gap-4">
                {products.map((product) => (
                  <li key={product.id} className="w-44 shrink-0">
                    <MenuProductCard product={product} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
