import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getProductDetailPageResult, mockProducts } from "@/lib/mock";
import type { Locale } from "@/lib/i18n/routing";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { buttonVariants } from "@/components/ui/button";
import { withLocale } from "@/components/storefront/home/home-utils";
import { ProductDetailView } from "@/components/storefront/product/ProductDetailView";

export const instant = false;

export function generateStaticParams() {
  return mockProducts.filter((p) => p.status !== "archived").map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) {
    return {
      robots: { index: false, follow: true },
    };
  }
  const title = locale === "bn" ? product.title.bn : product.title.en;
  const description = locale === "bn" ? product.description.bn : product.description.en;
  return {
    title,
    description,
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Product");

  const result = getProductDetailPageResult(slug, sp);
  const browseHref = withLocale(locale, "/search");

  if (result.scenario === "loading") {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader title={t("loadingTitle")} description={t("prototypeNote")} />
        <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={8} />
      </PageContainer>
    );
  }

  if (result.scenario === "error") {
    const msg = locale === "bn" ? result.message.bn : result.message.en;
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader title={t("errorTitle")} description={t("prototypeNote")} />
        <ErrorState title={t("errorTitle")} message={msg || t("errorMessage")} />
        <Link href={browseHref} className={buttonVariants({ variant: "outline" })}>
          {t("backToBrowse")}
        </Link>
      </PageContainer>
    );
  }

  const data = result.data;
  if (!data || data.notFound || !data.product) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader title={t("notFoundTitle")} description={t("prototypeNote")} />
        <EmptyState
          title={t("notFoundTitle")}
          message={t("notFoundMessage")}
          action={
            <Link href={browseHref} className={buttonVariants({ variant: "default" })}>
              {t("backToBrowse")}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return <ProductDetailView locale={locale} data={data} />;
}
