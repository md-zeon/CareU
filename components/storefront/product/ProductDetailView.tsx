import type { Locale } from "@/lib/i18n/routing";
import type { ProductDetailPageResult } from "@/lib/mock/pdp";
import { getTranslations } from "next-intl/server";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { pickText } from "@/components/storefront/home/home-utils";
import { ProductBreadcrumbs } from "./ProductBreadcrumbs";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { ProductDetailsSection } from "./ProductDetailsSection";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { ProductCrossSellSection } from "./ProductCrossSellSection";
import { RecentlyViewedSection } from "./RecentlyViewedSection";
import { ProductFutureExperience } from "./ProductFutureExperience";
import { StarIcon } from "lucide-react";

export async function ProductDetailView({
  locale,
  data,
}: {
  locale: Locale;
  data: ProductDetailPageResult;
}) {
  const t = await getTranslations("Product");
  const tBrowse = await getTranslations("Browse");
  const th = await getTranslations("Home");

  if (!data.product || data.notFound) return null;
  const product = data.product;
  const selectedVariant = data.variants.find((v) => v.id === data.selectedVariantId) ?? data.variants[0] ?? null;
  const shopLabels = { careu: th("fromCareu"), seller: th("fromSeller") };
  const ratingText = product.rating
    ? product.rating.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 })
    : null;

  return (
    <PageContainer className="space-y-8 py-8 sm:py-10 lg:space-y-10 lg:py-12">
      <ProductBreadcrumbs items={data.breadcrumbs} locale={locale} label={t("breadcrumbs")} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        <div className="space-y-4">
          <ProductGallery
            items={data.gallery}
            locale={locale}
            label={t("galleryLabel")}
            viewImageLabel={t.raw("viewImage")}
          />
        </div>
        <div className="space-y-5">
          <div className="space-y-3">
            {product.brand ? (
              <p className="text-sm font-medium text-muted-foreground">{pickText(product.brand.label, locale)}</p>
            ) : null}
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              {pickText(product.title, locale)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              {ratingText ? (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <StarIcon className="size-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                  <span className="font-medium">{ratingText}</span>
                  {typeof product.reviewCount === "number" ? (
                    <span className="text-muted-foreground">
                      ({product.reviewCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {th("reviewsLabel")})
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
          <ProductPurchasePanel
            locale={locale}
            variants={data.variants}
            selectedVariantId={selectedVariant?.id ?? data.selectedVariantId}
            shop={data.shop}
            labels={{
              price: t("price"),
              compareAt: t("compareAt"),
              availability: t("availability"),
              sku: t("sku"),
              variants: t("variants"),
              selectedOption: t("selectedOption"),
              shopContext: t("shopContext"),
              shopLabel: t("shopLabel"),
              addToCart: t("addToCart"),
              addedToCart: t("addedToCart"),
              addToWishlist: t("addToWishlist"),
              addedToWishlist: t("addedToWishlist"),
              proceedToCheckout: t("proceedToCheckout"),
              continueBrowsing: t("continueBrowsing"),
              unavailableAction: t("unavailableAction"),
              unavailableMessage: t("unavailableMessage"),
              quantityLabel: t("quantityLabel"),
              quantityNote: t("quantityNote"),
              inStock: tBrowse("inStock"),
              lowStock: tBrowse("lowStock"),
              outOfStock: tBrowse("outOfStock"),
            }}
          />
        </div>
      </div>

      <ProductDetailsSection
        locale={locale}
        title={t("detailsTitle")}
        description={data.details.description}
        highlights={data.details.highlights}
        specifications={data.details.specifications}
        labels={{
          description: t("description"),
          highlights: t("highlights"),
          specifications: t("specifications"),
        }}
      />

      <ProductReviewsSection
        locale={locale}
        summary={data.reviewSummary}
        reviews={data.reviews}
        labels={{
          title: t("reviewsTitle"),
          averageRating: t("averageRating"),
          reviewCountLabel: t.raw("reviewCountLabel"),
          ratingBreakdown: t("ratingBreakdown"),
          stars: t.raw("stars"),
          noReviewsTitle: t("noReviewsTitle"),
          noReviewsMessage: t("noReviewsMessage"),
          writeReview: t("writeReview"),
          writeReviewPromptTitle: t("writeReviewPromptTitle"),
          writeReviewPromptMessage: t("writeReviewPromptMessage"),
          writeReviewAction: t("writeReviewAction"),
          ratingOutOfFive: t.raw("ratingOutOfFive"),
        }}
      />

      <div className="space-y-8">
        <ProductCrossSellSection locale={locale} group={data.crossSell.frequentlyBoughtTogether} shopLabels={shopLabels} />
        <ProductCrossSellSection locale={locale} group={data.crossSell.moreFromShop} shopLabels={shopLabels} />
        <RecentlyViewedSection
          locale={locale}
          currentProductId={product.id}
          fallbackGroup={data.crossSell.recentlyViewed}
          shopLabels={shopLabels}
          prototypeNote={t("prototypeBlockNote")}
        />
        <ProductCrossSellSection locale={locale} group={data.crossSell.related} shopLabels={shopLabels} />
      </div>

      <Section title={t("futureExperiencesTitle")} description={t("futureExperiencesMessage")} contentClassName="space-y-0">
        <ProductFutureExperience locale={locale} item={data.futureExperience} />
      </Section>

      <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
    </PageContainer>
  );
}
