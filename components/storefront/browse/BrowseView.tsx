import Link from "next/link";
import type { Locale } from "@/lib/i18n/routing";
import type { BrowsePageResult } from "@/lib/mock/browse";
import { getSortOptions } from "@/lib/mock/browse";
import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, ErrorState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { BrowseBreadcrumbs } from "./BrowseBreadcrumbs";
import { BrowseControls } from "./BrowseControls";
import { BrowsePagination } from "./BrowsePagination";
import { BrowseProductGrid } from "./BrowseProductGrid";
import { buttonVariants } from "@/components/ui/button";

export async function BrowseView({
  locale,
  basePath,
  searchParamsString,
  result,
  mode,
}: {
  locale: Locale;
  basePath: string;
  searchParamsString: string;
  result:
    | { kind: "ok"; data: BrowsePageResult }
    | { kind: "not_found" }
    | { kind: "empty_query" }
    | { kind: "no_results"; data: BrowsePageResult }
    | { kind: "error" };
  mode: "category" | "collection" | "brand" | "search";
}) {
  const t = await getTranslations("Browse");
  const th = await getTranslations("Home");
  const sp = new URLSearchParams(searchParamsString);

  if (result.kind === "error") {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <ErrorState title={t("notFoundTitle")} message={t("noResultsMessage")} />
      </PageContainer>
    );
  }
  if (result.kind === "not_found") {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader title={t("notFoundTitle")} description={t("prototypeNote")} />
        <EmptyState title={t("notFoundTitle")} message={t("notFoundMessage")} />
      </PageContainer>
    );
  }
  if (result.kind === "empty_query") {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <BrowseBreadcrumbs items={[{ label: { en: t("home"), bn: t("home") }, href: "/" }, { label: { en: "Search", bn: "সার্চ" } }]} locale={locale} label={t("breadcrumbs")} />
        <PageHeader title={t("emptyQueryTitle")} description={t("emptyQueryMessage")} />
        <EmptyState title={t("emptyQueryTitle")} message={t("emptyQueryMessage")} />
        <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
      </PageContainer>
    );
  }

  const data = result.data;
  const sortOptions = getSortOptions(data.surface).map((o) => ({ key: o.key, label: o.label }));
  const gridLabels = {
    wishlist: t("addToWishlist"),
    cart: t("addToCart"),
    wishlistAdded: t("addedToWishlist"),
    cartAdded: t("addedToCart"),
    fromCareu: th("fromCareu"),
    fromSeller: th("fromSeller"),
    rating: th("ratingLabel"),
    reviews: th("reviewsLabel"),
  };
  const controlLabels = {
    filters: t("filters"),
    sortBy: t("sortBy"),
    activeFilters: t("activeFilters"),
    clearAll: t("clearAll"),
    applyFilters: t("applyFilters"),
    showResults: t("showResults"),
    resetFilters: t("resetFilters"),
    minPrice: t("minPrice"),
    maxPrice: t("maxPrice"),
    priceRange: t("priceRange"),
    resultsCount: t.raw("resultsCount"),
  };

  const resetHref = withLocale(locale, basePath + (data.appliedFilters.q ? `?q=${encodeURIComponent(data.appliedFilters.q)}` : ""));

  return (
    <PageContainer className="space-y-6 py-8 sm:py-10 lg:py-12">
      <BrowseBreadcrumbs items={data.breadcrumbs} locale={locale} label={t("breadcrumbs")} />
      <PageHeader
        eyebrow={mode === "collection" ? t("collectionEyebrow") : undefined}
        title={pickText(data.title, locale)}
        description={data.description ? pickText(data.description, locale) : undefined}
      />

      <BrowseControls
        locale={locale}
        facets={data.facets}
        sortOptions={sortOptions}
        activeSort={data.activeSort}
        labels={controlLabels}
        totalCount={data.totalCount}
      />

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-4">
            {/* Desktop filters: reuse same form behavior via controls logic would be ideal, but for prototype keep simple */}
            <p className="mb-3 text-base font-semibold">{t("filters")}</p>
            <p className="text-sm text-muted-foreground">{t("activeFilters")}: {t("showResults").toLowerCase()} via controls above on mobile; on desktop adjust filters above and in URL.</p>
          </div>
        </aside>
        <div className="space-y-6">
          {result.kind === "no_results" || data.items.length === 0 ? (
            <EmptyState
              title={mode === "search" ? t("noResultsTitle") : t("noMatchesTitle")}
              message={mode === "search" ? t("noResultsMessage") : t("noMatchesMessage")}
              action={
                <Link href={resetHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {t("resetFilters")}
                </Link>
              }
            />
          ) : (
            <BrowseProductGrid items={data.items} locale={locale} labels={gridLabels} gridLabel={t("gridLabel")} />
          )}
          <BrowsePagination
            locale={locale}
            basePath={basePath}
            searchParams={sp}
            page={data.page}
            pageCount={data.pageCount}
            labels={{ previous: t("previous"), next: t("next"), pageOf: t.raw("pageOf") }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
    </PageContainer>
  );
}
