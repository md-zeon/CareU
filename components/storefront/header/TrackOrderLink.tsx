import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PackageSearchIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";

type TrackOrderLinkProps = {
  locale: Locale;
  className?: string;
};

/** Public order-tracking entry point (/order/track). */
export default async function TrackOrderLink({
  locale,
  className,
}: TrackOrderLinkProps) {
  const t = await getTranslations("Header");

  return (
    <Link
      href={`/${locale}/order/track`}
      className={className}
      aria-label={t("trackOrder")}
    >
      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <PackageSearchIcon aria-hidden="true" className="size-4" />
        <span>{t("trackOrder")}</span>
      </span>
    </Link>
  );
}
