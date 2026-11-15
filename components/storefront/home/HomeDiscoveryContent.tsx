import { PageContainer } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeDiscoveryPayload } from "@/lib/mock/home";
import type { ScenarioResult } from "@/lib/mock/types";
import { HomeBrandHighlights } from "./HomeBrandHighlights";
import { HomeCampaigns } from "./HomeCampaigns";
import { HomeClosingLinks } from "./HomeClosingLinks";
import { HomeEditorial } from "./HomeEditorial";
import { HomeFeaturedCategories } from "./HomeFeaturedCategories";
import { HomeFeaturedProducts } from "./HomeFeaturedProducts";
import { HomeHero } from "./HomeHero";
import { HomeTrustStrip } from "./HomeTrustStrip";

export type HomeMessages = {
  trustTitle: string;
  featuredCategoriesTitle: string;
  featuredCategoriesDescription: string;
  promotionsTitle: string;
  promotionsDescription: string;
  featuredProductsTitle: string;
  featuredProductsDescription: string;
  brandsTitle: string;
  brandsDescription: string;
  closingTitle: string;
  closingDescription: string;
  viewCategory: string;
  viewProduct: string;
  viewBrand: string;
  fromCareu: string;
  fromSeller: string;
  ratingLabel: string;
  reviewsLabel: string;
  sectionEmptyTitle: string;
  sectionEmptyMessage: string;
  pageErrorTitle: string;
  pageErrorMessage: string;
  loadingTitle: string;
  loadingMessage: string;
  prototypeNote: string;
};

function HomePageLoading({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-0">
      <section className="border-b bg-muted/20">
        <PageContainer className="py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <LoadingState title={title} message={message} rows={6} />
            <div className="aspect-4/3 animate-pulse rounded-3xl border bg-muted" aria-hidden="true" />
          </div>
        </PageContainer>
      </section>
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <LoadingState title={title} message={message} rows={3} />
        <LoadingState title={title} message={message} rows={4} />
        <LoadingState title={title} message={message} rows={4} />
      </PageContainer>
    </div>
  );
}

export function HomeDiscoveryContent({
  result,
  locale,
  messages,
}: {
  result: ScenarioResult<HomeDiscoveryPayload>;
  locale: Locale;
  messages: HomeMessages;
}) {
  if (result.scenario === "loading") {
    return <HomePageLoading title={messages.loadingTitle} message={messages.loadingMessage} />;
  }

  if (result.scenario === "error") {
    const errorMessage = locale === "bn" ? result.message.bn : result.message.en;
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <ErrorState title={messages.pageErrorTitle} message={errorMessage || messages.pageErrorMessage} />
        <p className="text-xs text-muted-foreground">{messages.prototypeNote}</p>
      </PageContainer>
    );
  }

  const data = result.data;
  const isEmpty =
    !data.hero &&
    data.trustItems.length === 0 &&
    data.featuredCategories.length === 0 &&
    data.campaigns.length === 0 &&
    data.featuredProducts.length === 0 &&
    data.featuredBrands.length === 0 &&
    !data.editorial &&
    data.closingLinks.links.length === 0;

  if (isEmpty) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <EmptyState title={messages.sectionEmptyTitle} message={messages.sectionEmptyMessage} />
        <p className="text-xs text-muted-foreground">{messages.prototypeNote}</p>
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col">
      {data.hero ? <HomeHero hero={data.hero} locale={locale} /> : null}
      <HomeTrustStrip items={data.trustItems} locale={locale} title={messages.trustTitle} />
      <HomeFeaturedCategories
        categories={data.featuredCategories}
        locale={locale}
        title={messages.featuredCategoriesTitle}
        description={messages.featuredCategoriesDescription}
        viewLabel={messages.viewCategory}
        emptyTitle={messages.sectionEmptyTitle}
        emptyMessage={messages.sectionEmptyMessage}
      />
      <HomeCampaigns
        campaigns={data.campaigns}
        locale={locale}
        title={messages.promotionsTitle}
        description={messages.promotionsDescription}
        emptyTitle={messages.sectionEmptyTitle}
        emptyMessage={messages.sectionEmptyMessage}
      />
      <HomeFeaturedProducts
        products={data.featuredProducts}
        locale={locale}
        title={messages.featuredProductsTitle}
        description={messages.featuredProductsDescription}
        viewLabel={messages.viewProduct}
        emptyTitle={messages.sectionEmptyTitle}
        emptyMessage={messages.sectionEmptyMessage}
        fromCareuLabel={messages.fromCareu}
        fromSellerLabel={messages.fromSeller}
        ratingLabel={messages.ratingLabel}
        reviewsLabel={messages.reviewsLabel}
      />
      <HomeBrandHighlights
        brands={data.featuredBrands}
        locale={locale}
        title={messages.brandsTitle}
        description={messages.brandsDescription}
        viewLabel={messages.viewBrand}
        emptyTitle={messages.sectionEmptyTitle}
        emptyMessage={messages.sectionEmptyMessage}
      />
      {data.editorial ? <HomeEditorial editorial={data.editorial} locale={locale} /> : null}
      <HomeClosingLinks
        block={data.closingLinks}
        locale={locale}
        fallbackTitle={messages.closingTitle}
        fallbackDescription={messages.closingDescription}
        emptyTitle={messages.sectionEmptyTitle}
        emptyMessage={messages.sectionEmptyMessage}
      />
      <PageContainer className="pb-10 sm:pb-14">
        <p className="text-xs text-muted-foreground">{messages.prototypeNote}</p>
      </PageContainer>
    </div>
  );
}
