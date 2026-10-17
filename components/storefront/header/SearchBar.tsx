import { getTranslations } from "next-intl/server";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/routing";

type SearchBarProps = {
  locale: Locale;
};

/**
 * Plain HTML GET form — works without JavaScript.
 * Submits to /{locale}/search?q=… as a full navigation.
 */
export default async function SearchBar({ locale }: SearchBarProps) {
  const t = await getTranslations("Header");

  return (
    <form
      action={`/${locale}/search`}
      method="get"
      role="search"
      className="w-full"
    >
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          name="q"
          required
          autoComplete="off"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="h-11 rounded-full border-transparent bg-muted pl-10 pr-28 focus-visible:border-ring focus-visible:bg-background"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-4"
        >
          {t("searchLabel")}
        </Button>
      </div>
    </form>
  );
}
