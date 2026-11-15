import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { getSearchBrowseResult } from "@/lib/mock/browse";
import { BrowseView } from "@/components/storefront/browse/BrowseView";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const locale = (await getLocale()) as Locale;
  const scenario = (typeof sp.scenario === "string" ? sp.scenario : undefined) as any;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "scenario") continue;
    if (Array.isArray(v)) v.forEach((x) => query.append(k, x));
    else if (v != null) query.set(k, v);
  }
  const result = getSearchBrowseResult(query, scenario ? { scenario } : undefined);

  if (result.scenario === "error") {
    return <BrowseView locale={locale} basePath="/search" searchParamsString={query.toString()} result={{ kind: "error" }} mode="search" />;
  }
  if (result.data === "empty_query") {
    return <BrowseView locale={locale} basePath="/search" searchParamsString={query.toString()} result={{ kind: "empty_query" }} mode="search" />;
  }
  if (!result.data) {
    return <BrowseView locale={locale} basePath="/search" searchParamsString={query.toString()} result={{ kind: "empty_query" }} mode="search" />;
  }
  const data = result.data;
  const kind = data.items.length === 0 ? "no_results" : "ok";
  return <BrowseView locale={locale} basePath="/search" searchParamsString={query.toString()} result={{ kind, data }} mode="search" />;
}
