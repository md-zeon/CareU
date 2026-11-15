import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { getCollectionBrowseResult } from "@/lib/mock/browse";
import { BrowseView } from "@/components/storefront/browse/BrowseView";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = getCollectionBrowseResult(slug, new URLSearchParams(), { scenario: "default" });
  if (result.scenario === "loading" || result.scenario === "error" || !result.data) {
    return { title: "Collection", robots: { index: false, follow: true } };
  }
  const locale = (await getLocale()) as Locale;
  const title = locale === "bn" ? result.data.title.bn : result.data.title.en;
  return { title, robots: { index: false, follow: true } };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = (await getLocale()) as Locale;
  const scenario = (typeof sp.scenario === "string" ? sp.scenario : undefined) as any;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "scenario") continue;
    if (Array.isArray(v)) v.forEach((x) => query.append(k, x));
    else if (v != null) query.set(k, v);
  }
  const result = getCollectionBrowseResult(slug, query, scenario ? { scenario } : undefined);

  if (result.scenario === "loading") {
    // simple loading rendering via view not directly supported; return a basic container
  }
  if (result.scenario === "error") {
    return <BrowseView locale={locale} basePath={`/collection/${slug}`} searchParamsString={query.toString()} result={{ kind: "error" }} mode="collection" />;
  }
  if (!result.data) {
    return <BrowseView locale={locale} basePath={`/collection/${slug}`} searchParamsString={query.toString()} result={{ kind: "not_found" }} mode="collection" />;
  }
  const data = result.data;
  const kind = data.items.length === 0 ? "no_results" : "ok";
  return <BrowseView locale={locale} basePath={`/collection/${slug}`} searchParamsString={query.toString()} result={{ kind, data }} mode="collection" />;
}
