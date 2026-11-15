import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeFeaturedCategory } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

export function HomeFeaturedCategories({
  categories,
  locale,
  title,
  description,
  viewLabel,
  emptyTitle,
  emptyMessage,
}: {
  categories: HomeFeaturedCategory[];
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
        {categories.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={withLocale(locale, category.href)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="relative aspect-4/3 bg-muted">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={pickText(category.name, locale)}
                        fill
                        sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="font-semibold leading-6">{pickText(category.name, locale)}</p>
                    {category.description ? (
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{pickText(category.description, locale)}</p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-foreground">
                      {viewLabel}
                      <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                    </span>
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
