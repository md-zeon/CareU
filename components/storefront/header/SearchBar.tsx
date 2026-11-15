import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { SearchAutocomplete } from "./SearchAutocomplete";

export default async function SearchBar({ locale }: { locale: Locale }) {
  const t = await getTranslations("Header");
  return (
    <SearchAutocomplete
      locale={locale}
      labels={{
        placeholder: t("searchPlaceholder"),
        label: t("searchLabel"),
        suggestions: t("searchSuggestions"),
        seeAllResults: t.raw("seeAllResults"),
        noSuggestions: t("noSuggestions"),
        typeToSearch: t("typeToSearch"),
      }}
    />
  );
}
