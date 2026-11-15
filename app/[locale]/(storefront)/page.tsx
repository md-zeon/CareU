import { getLocale, getTranslations } from "next-intl/server";
import { getHomeDiscovery } from "@/lib/mock/home";
import type { Locale } from "@/lib/i18n/routing";
import { HomeDiscoveryContent } from "@/components/storefront/home/HomeDiscoveryContent";

export default async function Home() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Home");
  const result = getHomeDiscovery({ scenario: "default" });

  return (
    <HomeDiscoveryContent
      result={result}
      locale={locale}
      messages={{
        trustTitle: t("trustTitle"),
        featuredCategoriesTitle: t("featuredCategoriesTitle"),
        featuredCategoriesDescription: t("featuredCategoriesDescription"),
        promotionsTitle: t("promotionsTitle"),
        promotionsDescription: t("promotionsDescription"),
        featuredProductsTitle: t("featuredProductsTitle"),
        featuredProductsDescription: t("featuredProductsDescription"),
        brandsTitle: t("brandsTitle"),
        brandsDescription: t("brandsDescription"),
        closingTitle: t("closingTitle"),
        closingDescription: t("closingDescription"),
        viewCategory: t("viewCategory"),
        viewProduct: t("viewProduct"),
        viewBrand: t("viewBrand"),
        fromCareu: t("fromCareu"),
        fromSeller: t("fromSeller"),
        ratingLabel: t("ratingLabel"),
        reviewsLabel: t("reviewsLabel"),
        sectionEmptyTitle: t("sectionEmptyTitle"),
        sectionEmptyMessage: t("sectionEmptyMessage"),
        pageErrorTitle: t("pageErrorTitle"),
        pageErrorMessage: t("pageErrorMessage"),
        loadingTitle: t("loadingTitle"),
        loadingMessage: t("loadingMessage"),
        prototypeNote: t("prototypeNote"),
      }}
    />
  );
}
