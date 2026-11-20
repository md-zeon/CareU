import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import type { MockScenario } from "@/lib/mock/types";
import { getCategoryBrowseResult } from "@/lib/mock/browse";
import { BrowseView } from "@/components/storefront/browse/BrowseView";
import { mockCategories } from "@/lib/mock/catalog";

export const instant = false;

export function generateStaticParams() {
  return mockCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = getCategoryBrowseResult(slug, new URLSearchParams(), { scenario: "default" });
  if (result.scenario === "loading" || result.scenario === "error" || !result.data) {
    return { title: "Category", robots: { index: false, follow: true } };
  }
  const locale = (await getLocale()) as Locale;
  const title = locale === "bn" ? result.data.title.bn : result.data.title.en;
  return { title, robots: { index: false, follow: true } };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = (await getLocale()) as Locale;
  const scenario: MockScenario | undefined =
    typeof sp.scenario === "string" &&
    (sp.scenario === "default" || sp.scenario === "empty" || sp.scenario === "loading" || sp.scenario === "error" || sp.scenario === "success")
      ? sp.scenario
      : undefined;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "scenario") continue;
    if (Array.isArray(v)) v.forEach((x) => query.append(k, x));
    else if (v != null) query.set(k, v);
  }
  const result = getCategoryBrowseResult(slug, query, scenario ? { scenario } : undefined);

  if (result.scenario === "error") {
    return <BrowseView locale={locale} basePath={`/category/${slug}`} searchParamsString={query.toString()} result={{ kind: "error" }} mode="category" />;
  }
  if (!result.data) {
    return <BrowseView locale={locale} basePath={`/category/${slug}`} searchParamsString={query.toString()} result={{ kind: "not_found" }} mode="category" />;
  }
  const data = result.data;
  const kind = data.items.length === 0 ? "no_results" : "ok";
  return <BrowseView locale={locale} basePath={`/category/${slug}`} searchParamsString={query.toString()} result={{ kind, data }} mode="category" />;
}
