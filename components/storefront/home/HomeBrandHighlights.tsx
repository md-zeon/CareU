import Link from "next/link";
import { StoreIcon } from "lucide-react";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeFeaturedBrand } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

export function HomeBrandHighlights({
  brands,
  locale,
  title,
  description,
  viewLabel,
  emptyTitle,
  emptyMessage,
}: {
  brands: HomeFeaturedBrand[];
  locale: Locale;
  title: string;
  description: string;
  viewLabel: string;
  emptyTitle: string;
  emptyMessage: string;
}) {
  return (
    <PageContainer className="py-10 sm:py-14">
      <Section title={title} description={description}>
        {brands.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={withLocale(locale, brand.href)}
                  className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground" aria-hidden="true">
                    <StoreIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-6">{pickText(brand.name, locale)}</p>
                    {brand.productCountLabel ? (
                      <p className="text-sm leading-6 text-muted-foreground">{pickText(brand.productCountLabel, locale)}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-medium">{viewLabel}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}
